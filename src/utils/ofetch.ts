// utils/ofetch.ts
import { ofetch } from 'ofetch';

/**
 * 自定义 ofetch 请求选项（只列出本项目用到的字段）
 */
export interface OfetchRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string | string[]>;
  query?: Record<string, string | number | boolean>;
  responseType?: 'json' | 'text' | 'stream' | 'blob';
  timeout?: number;
}

/**
 * 我们期望从 ofetch.raw 得到的“流响应”形状
 */
export interface OfetchRawResponse {
  status: number;
  headers: {
    get(name: string): string | null;
    entries(): IterableIterator<[string, string]>;
  };
  body: ReadableStream<Uint8Array> | null;
}

/**
 * JSON/text/etc 请求 — 返回泛型 T（对应你对 ofetch 的预期 response body）
 */
export async function ofetchJson<T = unknown>(
  url: string,
  opts?: OfetchRequestOptions
): Promise<T> {
  // 强制设置 responseType 为 'json'，确保类型安全
  const optsForOfetch = {
    ...opts,
    responseType: 'json',
  } as const;

  const res = await ofetch<T>(url, optsForOfetch);
  return res;
}

/**
 * 原生流请求 — 返回我们定义的 OfetchRawResponse（包含 status/header/body）
 */
export async function ofetchRawStream(
  url: string,
  opts?: OfetchRequestOptions
): Promise<OfetchRawResponse> {
  // 确保 responseType 为 stream
  const merged: OfetchRequestOptions = {
    ...(opts ?? {}),
    responseType: 'stream',
  };
  const optsForOfetch = merged as unknown as Parameters<typeof ofetch.raw>[1];
  const raw = await ofetch.raw(url, optsForOfetch);
  // 把第三方返回的对象（runtime 上肯定有这些字段）窄化为我们定义的接口
  return raw as unknown as OfetchRawResponse;
}
