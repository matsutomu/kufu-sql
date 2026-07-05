# kufu:SQL 工夫

> 禅語「工夫」× SQL — 手を動かして学ぶSQL学習サービス

🌐 **https://kufusql.sanpo-insight.com**

## 概要

ブラウザ上でSQLを実行しながら学べるインタラクティブなSQL学習サービスです。

- **ログイン不要** — URLを開いてすぐ学習開始
- **ブラウザ内SQL実行** — sql.js（SQLite on WebAssembly）で完結
- **採点機能** — 正解/不正解を即時フィードバック
- **進捗管理** — セッションごとに学習進捗を記録
- **70問収録** — SQL基礎からWindow関数まで、架空のSaaS企業「Kufu Cloud」の業務を題材に学習

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React + TypeScript + Vite |
| SQL実行 | sql.js（SQLite on WebAssembly）|
| API | Go 1.26.4 |
| DB | PostgreSQL 18 |
| インフラ | AWS EC2 t4g.small / CloudFront / S3 / Route53 |
| CI/CD | GitHub Actions |

## アーキテクチャ

| 層 | 内容 |
|---|---|
| ブラウザ | sql.js（SQLite on WASM）でSQL実行 |
| CloudFront | HTTPSでフロントとAPIを振り分け |
| S3 | フロントエンド静的配信 |
| EC2:8080 | Go API — 採点・進捗管理 |
| PostgreSQL 18 | 問題マスタDB（EC2内ローカル）|

## ローカル開発

### 必要な環境

- Go 1.22+
- Node.js 20+
- PostgreSQL 18

### バックエンド

```bash
cd backend
export DB_USER=kufusql
export DB_PASSWORD=your_password
export DB_NAME=kufusql
go run ./cmd/api/
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

## デプロイ

### フロントエンド（S3 + CloudFront）

```bash
# 1. ビルド
cd frontend
npm run build

# 2. S3へ同期
#    --delete は dist/ にないファイルをバケットから削除する。
#    メンテナンスページを同じバケットに置いている場合は --exclude で保護する。
aws s3 sync dist/ s3://<S3バケット名>/ --delete --exclude "maintenance.html"

# 3. CloudFrontのキャッシュを無効化（これをしないと古い画面が表示され続ける）
aws cloudfront create-invalidation \
  --distribution-id <ディストリビューションID> \
  --paths "/*"
```

- Viteはjs/cssにハッシュ付きファイル名を使うため、キャッシュが問題になるのは実質 `index.html` のみ。`--paths "/index.html"` でも足りるが `/*` が確実（無効化は月1,000パスまで無料）。
- 無効化は通常1〜2分で完了する。`aws cloudfront get-invalidation --distribution-id <ディストリビューションID> --id <無効化ID>` で `Completed` になれば反映済み。

### サービス時間外ページ

`infra/s3/maintenance.html` をS3に配置し、サービス停止時間帯にCloudFront側で切り替えて使う。

```bash
aws s3 cp infra/s3/maintenance.html s3://<S3バケット名>/
```

### 問題データ（PostgreSQL）

問題マスタは `backend/migrations/` を番号順に適用する。問題の追加・修正は
`frontend/scripts/gen_problems.cjs` の定義を編集して再生成する（期待結果JSONは
フロントと同じ sql.js で正解SQLを実行して生成されるため、手編集しない）。

```bash
cd frontend
node scripts/gen_problems.cjs   # → backend/migrations/005_kufu_cloud_problems.sql を再生成
```

## ライセンス

Apache License 2.0
