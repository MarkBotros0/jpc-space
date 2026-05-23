import { Readable } from "node:stream";
import type { PutMeta, PutResult, Storage } from "./index";

// Stubbed S3 driver — wire up @aws-sdk/client-s3 when production storage is needed.
// Reads S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT from env.
export class S3Storage implements Storage {
  async put(_key: string, _data: Buffer | Readable, _meta: PutMeta): Promise<PutResult> {
    throw new Error("S3Storage.put not implemented — wire up @aws-sdk/client-s3 before enabling.");
  }

  async get(_path: string): Promise<Readable> {
    throw new Error("S3Storage.get not implemented.");
  }

  async delete(_path: string): Promise<void> {
    throw new Error("S3Storage.delete not implemented.");
  }

  async url(_path: string): Promise<string> {
    throw new Error("S3Storage.url not implemented.");
  }
}
