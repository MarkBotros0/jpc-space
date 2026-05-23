import { Readable } from "node:stream";
import { LocalFsStorage } from "./local";
import { S3Storage } from "./s3";

export interface PutMeta {
  mime: string;
}

export interface PutResult {
  path: string;
}

export interface Storage {
  put(key: string, data: Buffer | Readable, meta: PutMeta): Promise<PutResult>;
  get(path: string): Promise<Readable>;
  delete(path: string): Promise<void>;
  url(path: string): Promise<string>;
}

let cached: Storage | undefined;

export function getStorage(): Storage {
  if (cached) return cached;
  const driver = process.env.STORAGE_DRIVER ?? "local";
  cached = driver === "s3" ? new S3Storage() : new LocalFsStorage();
  return cached;
}

export function buildStorageKey(parts: {
  bucket: string;
  publicId: string;
  originalName: string;
  date?: Date;
}): string {
  const d = parts.date ?? new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const safeName = parts.originalName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  return `${parts.bucket}/${yyyy}/${mm}/${parts.publicId}-${safeName}`;
}
