# doo

ミッションを自分や友だちに渡して、クリアした証拠を投稿していくSNSアプリです。

- **ホーム** — みんなの達成（写真・動画・テキスト）が並ぶフィード
- **ミッション作成** — ミッション名・内容・証明方法・カテゴリを書いて、自分や友だちに渡す
  （渡す相手は決めずに作っておいて、あとからプロフィールで渡すこともできる）
- **プロフィール** — アカウント名と、いま自分に来ているミッション一覧

### カテゴリ

ミッションには固定リストのカテゴリを複数つけられる（料理 / 運動 / おでかけ / 学び /
つくる / ネタ / 暮らし / その他）。任意なので、つけなくても作れる。
ホームのフィードは上部のチップでカテゴリ絞り込みができる（複数選択は OR）。

### リレー

ミッションはリレーにできます。クリアした人は次の人を **指名する / ランダムで決める / ここで止める**
のどれかを選べます。リレーを始めるときに「1人が指名できる人数」を最大10人まで設定できるので、
チェーンは1本にも枝分かれにもなります。リレーの全体像は `/relay/[relayId]` のツリー表示で追えます。

### 写真・動画のアップロード

達成の証拠は、アプリのフォトライブラリ／カメラから選んで
そのまま Cloudflare R2 にアップロードします（写真 10MB / 動画 100MB まで）。
API は有効期限 5 分の presigned PUT を返すだけで、ファイル本体はサーバーを通りません。
詳しくは [ADR](docs/adr/2026-09-04-media-upload-to-cloudflare-r2.md) を参照。

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React Native, Expo, Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

1. 依存関係をインストールする:

```bash
bun install
```

2. 環境変数を用意する（`.env` が無いとサーバーもアプリも起動しない）:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/native/.env.example apps/native/.env
```

`apps/server/.env` の `BETTER_AUTH_SECRET` は 32 文字以上にする
（`openssl rand -base64 32` など）。

写真・動画のアップロードを使う場合は `R2_*` も設定する。
Cloudflare ダッシュボードで R2 バケットを作り、**R2 > Manage API tokens** で
Object Read & Write のアクセスキーを発行し、バケットの公開 URL
（r2.dev の開発 URL かカスタムドメイン）を `R2_PUBLIC_BASE_URL` に入れる。
未設定でもサーバーは起動するが、アップロードだけが使えない。

3. スキーマをデータベースに反映する:

```bash
bun run db:push
```

これを忘れると、サインアップ時にサーバーが
`SQLITE_ERROR: no such table: user` で 500 を返す。

4. 開発サーバーを起動する:

```bash
bun run dev
```

API は [http://localhost:3000](http://localhost:3000) で動く。
iOS シミュレーターはホストの `localhost` をそのまま解決できるが、
実機で動かす場合は `apps/native/.env` の `EXPO_PUBLIC_SERVER_URL` を
開発マシンの LAN IP に変える。

`turso dev` でローカル DB サーバーを立てる場合は、`bun run db:local` を
起動したうえで `DATABASE_URL` をそのエンドポイントに向ける。

## Project Structure

```
doo/
├── apps/
│   ├── native/      # Mobile application (React Native, Expo)
│   └── server/      # Backend API (Hono, TRPC)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   ├── db/          # Database schema & queries
│   └── storage/     # Cloudflare R2 (presigned uploads)
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run test`: Run the API and storage tests
- `bun run dev:native`: Start the React Native/Expo development server
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run db:local`: Start the local SQLite database
- `bun run db:seed`: ユーザーストーリー用のシードデータを投入する（`docs/user-stories/` 参照）
