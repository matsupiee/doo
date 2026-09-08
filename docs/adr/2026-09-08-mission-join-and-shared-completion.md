# 「やりたいこと」に join して、達成を共同で記録する

- 日付: 2026-09-08
- ステータス: 採用（スキーマのみ先行、API/UI は後続）

## 背景

アプリのコンセプトを次のように変更する。

- ユーザーは最初に**自分のやりたいこと**を登録する
- **達成したら投稿する**
- 他のユーザーは、やりたいことに**あとから join できる**
- 達成は**共同達成として記録できる**。1人で達成した場合は個人達成として記録する

旧コンセプトの「ミッションを他人に渡す・リレーで回す」は廃止する。これにより
`assignment` / `relay` / `mission_category` は不要になった。

とくに設計上の要点は**達成が1人に紐づかない**ことで、旧モデルの
「1人分のミッション＝ `assignment`、その証拠＝ `post`」という 1:1 の構造では
共同達成を表現できない。

## 決定

達成を**独立したテーブル**にし、参加者を中間テーブルでぶら下げる。

| テーブル                         | 役割                                              |
| -------------------------------- | ------------------------------------------------- |
| `mission`                        | やりたいこと本体。作成者は `creator_id`           |
| `mission_participant`            | そのミッションを「やる」人。join はこの行の作成   |
| `mission_completion`             | 達成イベント1件。ミッションと投稿と達成日時を持つ |
| `mission_completion_participant` | その達成を誰が達成したか                          |
| `post`                           | フィード投稿。達成報告にも進捗報告にも使う        |
| `mission_tag`                    | ミッションに付ける自由入力のタグ                  |

**個人達成と共同達成の区別は `mission_completion_participant` の行数で表す。**
1行なら個人達成、複数行なら共同達成であり、テーブルもフラグも分けない。

`mission_participant` / `mission_completion_participant` は複合主キー
（`(mission_id, user_id)` / `(completion_id, user_id)`）を持ち、
二重 join・同じ達成への二重参加を DB が弾く。

### 同じミッションの複数回達成を許可する

`mission_completion` は状態ではなく**イベント**として扱い、1つのミッションに対して
何件でも作れる。「毎朝走る」のような繰り返し前提のやりたいことを表現するため。
`(mission_id, user_id)` の一意制約は張らない。

### 達成参加者は、そのミッションの参加者でなければならない

これを DB で担保するため、`mission_completion_participant` に `mission_id` を持たせ、
複合 FK を2本張る。

```
(completion_id, mission_id) -> mission_completion  (id, mission_id)
(mission_id,    user_id)    -> mission_participant (mission_id, user_id)
```

`mission_id` が両方の FK に登場することで、「達成が属するミッション」と
「参加しているミッション」が同じ1つの値に固定される。参照先に unique 制約が要るので、
`mission_completion` に `(id, mission_id)` の unique index を追加した。

libsql は SQLite と違い `PRAGMA foreign_keys` が既定で ON であること、複合 FK が
実際に効くことは、生成した SQL を一時 DB に流して確認済み。

| 試したこと | 結果 |
|---|---|
| 参加者を、参加しているミッションの達成に入れる | 通る |
| 参加していない人を達成に入れる | FK 違反で弾かれる |
| 別ミッションの参加者行を借りて入れる | FK 違反で弾かれる |
| 同じ達成に同じ人を2回入れる | 主キー違反で弾かれる |
| 同じミッションを2回目の達成として記録する | 通る（意図どおり） |
| 投稿なしで達成を記録する | NOT NULL 違反で弾かれる |

### 達成のある人はミッションから抜けられない

`mission_participant` への FK は cascade なので、参加をやめるとその人の
`mission_completion_participant` の行も道連れになる。過去の達成が消えるのは
記録として不正なので、**達成が1件でもある参加者の退出を API で禁止する**。

これにより cascade が実際に走るのはミッションそのものを削除したときだけになり、
そのときは達成ごと消えるのが正しい挙動になる。`left_at` による論理削除は採らない
（参加中かどうかの判定が全クエリに波及するのと、複合 FK の参照先が
「抜けた人の行」でも成立してしまい、せっかくの整合性チェックが緩むため）。

join に承認・招待の概念は持たせない。他人のやりたいことを見て自分から乗るだけなので、
`mission_participant` の行を作れば参加であり、状態カラムは不要。

## 今回スキーマに入れた修正

コンセプト変更のコミットで入った定義のうち、次を直した。

- **`schema/index.ts` に `mission_participant` / `mission_completion` /
  `mission_completion_participant` が載っていなかった。** `packages/db/src/index.ts` は
  `import * as schema from "./schema"` を drizzle に渡しているので、barrel に無いテーブルは
  実行時のスキーマに登録されず、`db.query.*` からもリレーショナルクエリからも見えない。
  drizzle-kit はディレクトリを直接読むためマイグレーションだけは出る、という気づきにくい
  食い違いになっていた。
- **`mission_completion` / `mission_completion_participant` に `relations()` が無かった。**
  それぞれ mission・post・participants・user への関連を定義した。
- **`post` から達成への逆向きの関連が無かった。** `post.completion` を追加（達成報告の投稿なら
  1件、進捗報告の投稿なら無し）。
- **`user` の関連が `sessions` / `accounts` / `missionParticipants` だけだった。**
  `createdMissions` / `posts` / `postReactions` / `completionParticipations` を追加。
- **`mission` に `completions` が無かった。**
- **`mission_completion.completed_at` が `mode: "timestamp"`（秒）だった。** 他のカラムは
  すべて `timestamp_ms` なので、同じ値を秒とミリ秒で読む事故になる。`timestamp_ms` に揃えた。
- **`mission_completion.post_id` が nullable + `set null` だった。** 「達成時には必ず post を
  行う」というコメントと矛盾するので `notNull` + `cascade` にし、
  `(post_id)` に unique index を張った（1つの投稿が2つの達成を表すことはない）。
- **索引が不足していた。** `mission_completion` の `mission_id` / `completed_at`、
  `mission_completion_participant` の `user_id`（プロフィールの達成一覧用）を追加。
- `mission_completion_participant` にだけ `created_at` / `updated_at` が無かったので揃えた。

## 理由

- 達成を独立したテーブルにすると、共同達成が「1件の達成に参加者が N 人」という自然な形になる。
  個人達成は N=1 なので、**同じ導線・同じ集計コードのまま**扱える。
- 参加者を `post` に持たせる案（投稿に複数の著者）だと、達成していないが投稿はする
  （進捗報告）ケースと混ざる。達成と投稿は別の概念として分ける。
- join を `mission_participant` の1行にすると、複合主キーだけで重複参加を防げる。

## 却下した選択肢

- **`post` に参加者をぶら下げて達成を表す**: 進捗報告の投稿と達成の投稿が同じ構造になり、
  「このミッションは誰がいつ達成したか」を引くのに投稿の種別で分岐が要る。
- **`mission_completion` に `user_id` を持たせ、共同達成は同じ `group_id` で束ねる**:
  結局グループを表す実体が要るので、それが `mission_completion` そのものである方が単純。
- **`mission_participant` に代理キー `id` を足し、`mission_completion_participant` が
  `mission_participant_id` 単体で参照する**: 「どこかのミッションの参加者である」ことしか
  保証できず、**その達成と同じミッションの参加者かどうかは検証されない**。
  別ミッションの参加者行を指した達成参加者を作れてしまう。複合 FK なら
  `mission_id` が共有されるのでこの穴が塞がる。
- **個人達成と共同達成をテーブルで分ける**: 集計とフィードの両方で常に2本のクエリが必要になる。
- **旧 `assignment` を残して流用する**: 「渡す・受ける」という意味を引きずったカラム
  （`assigner_id` / `picked_by` / `relay_*`）がコンセプトと合わない。

## 影響

- `assignment` / `relay` / `mission_category` テーブルは廃止。旧 ADR 3件は本 ADR で置き換える。
- **マイグレーションは未生成**。`drizzle-kit generate` が「新テーブルは旧テーブルの
  リネームか？」を対話で聞いてくるため、`docs/rules/database-pattern.md` の
  「インタラクティブな質問がある場合はユーザーに確認を求める」に従い、生成は行っていない。
  リネームではなく新規作成として答える必要がある。
- `packages/api`（`mission` / `feed` / `user` ルーター）、`apps/native`、
  `packages/db/src/seed` は旧モデル前提のままで型エラーになっている。後続で書き直す。

## 積み残し（後続で決める）

- **参加していない人を共同達成に含めたいとき**（当日その場で誘われた人など）、
  達成の記録時にその人を暗黙に join させるか、先に join を求めるかを決める。
- **作成者が `mission_participant` の行を持つか。** 「作ったが自分ではやらない」を許すなら
  作成者と参加者は別物になる。旧 ADR の「相手のいないミッション」に相当する状態なので、
  持たせない前提で API を書くなら、参加者0人のミッションの見え方を決める必要がある。
- **タグが自由入力になった。** 旧 `mission_category` の固定 enum をやめたため、表記ゆれで
  絞り込みが効かなくなる。候補のサジェストか、正規化のルールが要る。
- **ミッションの公開範囲。** 他人のやりたいことを見て join する以上、未達成のやりたいことが
  公開される。非公開フラグが要るかは未決。
- **通知がない。** 自分のやりたいことに誰かが join したことに気づく場所がない。
