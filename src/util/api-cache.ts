import { promises as fs } from "node:fs";

export type CacheResponse<T> = { meta: { cachePrefix: string }; data: T };
export type CacheOrComputer = <T>(
  api_url: string,
  api_body: unknown,
  call: (util: WriteUtil) => Promise<T>
) => Promise<CacheResponse<T>>;

const cachePath: string = "./data/api-cache/";

async function digestMessage(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}
export type WriteUtil = {
  cachePrefix: string;
  writeCompanion: (
    filename: string,
    data: string | Uint8Array
  ) => Promise<void>;
};

export async function apiFromCacheOr<T>(
  api_url: string,
  api_body: unknown,
  call: (util: WriteUtil) => Promise<T>
): Promise<CacheResponse<T>> {
  const hash = await digestMessage(JSON.stringify({ api_url, api_body }));
  const cachePrefix = cachePath + hash.slice(0, 16);
  const cacheFilePath = cachePrefix + ".json";
  try {
    const cache = JSON.parse(await fs.readFile(cacheFilePath, "utf8"))
      .api_response as T;
    return { meta: { cachePrefix }, data: cache };
  } catch (e) {
    // could not read cache, continue
  }
  const response = await call({
    cachePrefix,
    async writeCompanion(filename: string, data: string | Uint8Array) {
      await fs.writeFile(cachePrefix + filename, data);
    },
  });
  await fs.mkdir(cachePath, { recursive: true });
  await fs.writeFile(
    cacheFilePath,
    JSON.stringify(
      {
        api_url,
        api_call_body: api_body,
        api_response: response,
        call_timestamp: new Date(),
      },
      null,
      2
    )
  );
  return { meta: { cachePrefix }, data: response };
}
