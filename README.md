# kufu:SQL 工夫

> 禅語「工夫」× SQL — 手を動かして学ぶSQLサービス

**🚧 現在構築中です（β公開目標：2026年9月22日）**

## 概要

- SQL構文・クエリをブラウザ上で実行しながら学べるWebサービス
- sql.js（SQLite on WASM）でSQL実行をブラウザ内完結
- Go API + PostgreSQL 18 によるバックエンド

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React + TypeScript |
| SQL実行 | sql.js（SQLite on WebAssembly）|
| API | Go 1.22+ |
| DB | PostgreSQL 18 |
| インフラ | AWS EC2 t4g.small / CloudFront / S3 |

## URL

https://kufusql.sanpo-insight.com（β公開後）

## ライセンス

Apache License 2.0
