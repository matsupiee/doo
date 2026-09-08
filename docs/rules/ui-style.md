# 画面の見た目のルール

`apps/native` の画面を作るときに従う。参考にしたのは、濃いチャコールの下地に
黄色のアクセントを1色だけ置く HR ダッシュボードのデザイン。

## 色

色は `apps/native/global.css` で heroui-native のトークンを上書きして決める。
画面側で `#` から始まる色を直接書かない。

- 下地は `background`、カードとタブバーは `surface`。
- カードの中でさらに一段沈めるところ（アバターの背景、読むだけのタグ、
  選ばれていない選択肢）は `surface-tertiary`。
- アクセントは黄色の `accent` ひとつだけ。1画面に1、2か所しか使わない。
  文字色は `accent-foreground` を使う（黄色の上に白い文字を置かない）。
- 達成を示すピルは黄緑の `success`。進捗は `surface-tertiary` のまま。

## 角丸

`--radius` から全サイズが決まる。カードとボタンは 30px（`rounded-3xl`）、
チップとピルは高さぶんの丸（`rounded-full`）。四角いアイコンタイルは
`rounded-2xl`。角丸の値を画面側で指定しない。

## 画面の骨組み

上から順に、丸ボタンの行、細字の大きなタイトル、数字のピル、中身。
ここは `ScreenHeader` が持つので、ナビゲーションのヘッダーは出さない
（`headerShown: false`）。

- `ScreenHeader` — タイトルと丸ボタン。`hasBackButton` で戻るボタンを出す。
- `StatPills` — タイトルの下に並べる数字。1つだけ `isHighlighted` にする。
- `ListPanel` と `ListRow` — 見出しと件数を持つ、行を並べるパネル。
- `FloatingTabBar` — 下に浮かぶタブバー。選んでいるタブだけが黄色のピルになり、
  ラベルもそのタブだけに出る。

タブのある画面では、タブバーに隠れないように `Container` に
`hasFloatingTabBar` を渡す。`FlatList` を直接使う画面では、
`FLOATING_TAB_BAR_HEIGHT` を下の余白に足す。

## 文字

見出しは大きく細く（`text-4xl font-light`）、本文は普通の太さ。
太字は名前や数字など、拾い読みするところにだけ使う。
