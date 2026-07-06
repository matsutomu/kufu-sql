# EC2起動状態通知 Lambda（kufu-sql-ec2-status-notifier）

EC2インスタンスの状態変化（EventBridge経由）を受け取り、フロントエンドが参照する
`s3://kufusql-frontend/status.json` を更新するLambda関数。

```
EC2状態変化 → EventBridge → Lambda → S3 (status.json) → CloudFront → フロント
```

status.json は世界公開されるため、`status` と `updated_at` 以外の情報
（インスタンスID等の内部情報）は含めないこと。

## ファイル構成

| ファイル | 説明 |
|---|---|
| `lambda_function.mjs` | Lambda本体（ハンドラ: `lambda_function.handler` / Node.js 20.x） |
| `package.json` / `package-lock.json` | 依存定義（@aws-sdk/client-s3） |
| `trust-policy.json` | Lambda実行ロールの信頼ポリシー |
| `permissions-policy.json` | 実行ロールの権限（status.jsonへのPutObjectとCloudWatch Logsのみ） |
| `function.zip` | ビルド成果物（**gitには含めない**。下記手順で再生成する） |

## ビルドとデプロイ

```bash
cd infra/scripts

# 1. 依存を取得（lock fileに従う）
npm ci

# 2. zipを作成
rm -f function.zip
zip -r -q function.zip lambda_function.mjs node_modules

# 3. Lambdaへ反映
aws lambda update-function-code \
  --function-name kufu-sql-ec2-status-notifier \
  --zip-file fileb://function.zip
```

## 動作確認

```bash
# EventBridgeのイベントを模して手動実行（stateは実際のEC2の状態に合わせること）
aws lambda invoke \
  --function-name kufu-sql-ec2-status-notifier \
  --payload '{"detail":{"state":"stopped","instance-id":"i-xxxx"}}' \
  --cli-binary-format raw-in-base64-out /dev/stdout

# 公開されているstatus.jsonを確認
curl -s https://kufusql.sanpo-insight.com/status.json
```
