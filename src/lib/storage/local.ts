import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { PutMeta, PutResult, Storage } from "./index";

export class LocalFsStorage implements Storage {
  private readonly root: string;

  constructor(root?: string) {
    this.root = path.resolve(root ?? process.env.LOCAL_UPLOADS_DIR ?? "./uploads");
  }

  async put(key: string, data: Buffer | Readable, _meta: PutMeta): Promise<PutResult> {
    const fullPath = path.join(this.root, key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    const source = Buffer.isBuffer(data) ? Readable.from(data) : data;
    await pipeline(source, createWriteStream(fullPath));
    return { path: key };
  }

  async get(storagePath: string): Promise<Readable> {
    return createReadStream(path.join(this.root, storagePath));
  }

  async delete(storagePath: string): Promise<void> {
    await unlink(path.join(this.root, storagePath)).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT") throw err;
    });
  }

  async url(storagePath: string): Promise<string> {
    // Dev: served by a Next.js route handler at /api/uploads/[...path] (to be added in the UI phase).
    return `/api/uploads/${storagePath.split(path.sep).join("/")}`;
  }
}
