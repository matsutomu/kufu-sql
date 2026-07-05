# kufu:SQL 工夫

> 禅語「工夫」× SQL — 手を動かして学ぶSQL学習サービス

🌐 **https://kufusql.sanpo-insight.com**

## 概要

ブラウザ上でSQLを実行しながら学べるインタラクティブなSQL学習サービスです。

- **ログイン不要** — URLを開いてすぐ学習開始
- **ブラウザ内SQL実行** — sql.js（SQLite on WebAssembly）で完結
- **採点機能** — 正解/不正解を即時フィードバック
- **進捗管理** — セッションごとに学習進捗を記録
- **18問収録** — SELECT基礎〜集計・グループ化まで

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

## ライセンス

Apache License 2.0
