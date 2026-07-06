# kufu:SQL — プロジェクト指示書

## 概要
- サービス名: kufu:SQL（禅語「工夫」+ SQL）
- URL: kufusql.sanpo-insight.com
- 目的: SQL構文・クエリ練習のインタラクティブWebサービス

## アーキテクチャ
- フロント: React + TypeScript + sql.js（SQLite on WASM）
- API: Go 1.22+（handler/usecase/repository/domainの4層）
- DB: PostgreSQL 18（EC2内ローカル、外部非公開）
- インフラ: EC2 t4g.small / CloudFront + S3 / Route53

## テスト方針
- ユニットテスト: testing + testify
- APIモック: net/http/httptest + sqlmock
- 統合テスト: testcontainers-go（Phase 2以降）

## コーディング規約
- Go: gofmt準拠、エラーは必ずハンドリング
- コメント: 日本語OK
- コミットメッセージ: feat/fix/docs/infra のプレフィックスをつける

## 開発フェーズ
- Phase 1（〜7/06）: インフラ構築、開発、動作確認
- Phase 2（7/07 〜7/29）: β公開に向けて詳細動作精査
