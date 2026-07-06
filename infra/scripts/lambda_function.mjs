import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET_NAME = "kufusql-frontend";
const OBJECT_KEY = "status.json";

export const handler = async (event) => {
  const state = event.detail.state; // running / stopped / stopping / pending

  // instance_id は世界公開されるファイルのため含めない（フロントは status しか読まない）
  const body = JSON.stringify({
    status: state,
    updated_at: new Date().toISOString(),
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: OBJECT_KEY,
      Body: body,
      ContentType: "application/json",
      CacheControl: "no-cache, no-store, must-revalidate",
    })
  );

  console.log(`status.json updated: ${state}`);
  return { statusCode: 200 };
};
