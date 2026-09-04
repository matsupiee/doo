# ミッションのカテゴリを中間テーブルで持つ

- 日付: 2026-09-04
- ステータス: 採用

## 背景

ミッションに「料理」「ネタ」のような分類を付けて、フィードを絞り込めるようにしたい。
1つのミッションに複数のカテゴリを紐づけられることが要件。

## 決定

`mission_category` テーブル（`mission_id` + `category`）を新設し、mission 1件に対して
カテゴリ1件につき1行を持つ。`category` は Drizzle の text enum で
`cooking / sports / outing / learning / creative / fun / life / other` に固定し、
`(mission_id, category)` に unique index を張って重複行を防ぐ。

カテゴリ名の表示ラベル（絵文字・日本語）はアプリ側 (`apps/native/lib/mission-categories.ts`) に置く。
native 側の型は tRPC の入力型から導出しているので、DB の enum を増やしてラベルを足し忘れると
型エラーになる。

## 理由

- 複数カテゴリが要件なので、`mission` の1カラムでは表現できない。
- 取りうる値が固定なので、`docs/rules/database-pattern.md` の「値が固定・変動しにくいカラムには
  enum を使う」に従い、DB レベルで不正な値を弾ける。
- カテゴリのマスタテーブルを別に作るより、テーブル数・JOIN・シードの手間が少ない。

## 却下した選択肢

- **`mission` に単一の `category` カラム**: 複数付けられないため要件を満たさない。
- **`category` マスタテーブル + `mission.category_id`**: ユーザーがカテゴリを作れるようにするなら
  必要だが、今回は固定リストで足りる。将来ユーザー定義カテゴリが要るようになったら、
  `mission_category.category` をマスタへの FK に置き換える。
- **カテゴリを自由入力の文字列にする**: 表記ゆれで絞り込みが機能しなくなる。

## 影響

- マイグレーション `0001_clear_dracula.sql` を追加。既存ミッションはカテゴリなし（`[]`）になる。
- `mission.inbox` / `mission.sent` / `feed.list` / `relay.get` の戻り値に `categories`
  （`feed.list` は `missionCategories`）が増える。
- `feed.list` にカテゴリ絞り込み用の `categories` 入力が増える（空配列で全件）。
