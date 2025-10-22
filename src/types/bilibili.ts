/**
 * Shared Type Definitions for Bilibili proxy controllers
 * Extracted from controllers and helpers so they can be imported centrally.
 */

/** Generic API response wrapper returned by Bilibili API */
export interface BaseResponse<T> {
  code: number;
  message: string;
  ttl: number;
  data: T;
}

/** WBI keys response shape */
export interface WbiKeysResponse {
  img_key: string;
  sub_key: string;
}

/** Partial shape of the "nav" API response needed for WBI keys */
export interface NavData {
  wbi_img: {
    img_url: string;
    sub_url: string;
  };
}

/** Minimal video view data used to obtain cid */
export interface VideoViewData {
  cid: number;
}

/** Representation of a DASH stream (video or audio) */
export interface DashStream {
  id: number;
  base_url: string;
  backup_url: string[];
  bandwidth?: number;
  mime_type?: string;
  codecs?: string;
  width?: number;
  height?: number;
  frame_rate?: string;
  sar?: string;
  segment_base: {
    index_range: string;
    initialization: string;
  };
  start_with_sap?: number;
  size: number;
  // optional field commonly present for audio streams
  audioSamplingRate?: number;
}

/** Aggregated DASH metadata returned by Bilibili play API */
export interface DashData {
  duration: number;
  timelength: number;
  minBufferTime: number;
  video: DashStream[];
  audio: DashStream[];
}

/** The full-ish playurl response data we expect from the API */
export interface PlayVideoData {
  timelength?: number;
  dash?: {
    timelength?: number;
    duration?: number;
    minBufferTime?: number;
    video?: DashStream[];
    audio?: DashStream[];
  };
  data?: {
    timelength?: number;
    dash?: {
      duration?: number;
      minBufferTime?: number;
      timelength?: number;
      video?: DashStream[];
      audio?: DashStream[];
    };
  };
  durl?: { url: string; size: number }[];
}

/** Parameters used to produce a WBI signature */
export type EncWbiParams = Record<string, string | number | boolean>;

/** Result of encWbi signing operation */
export interface EncWbiResult {
  wts: number;
  w_rid: string;
}

/* -------------------- ofetch wrapper related types -------------------- */

/** A minimal request options shape for our ofetch wrapper (only fields we use) */
export interface OfetchRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  responseType?: 'json' | 'text' | 'stream' | 'blob';
  timeout?: number;
}

/** Minimal headers-like interface we expect from ofetch.raw() */
export interface OfetchHeaders {
  get(name: string): string | null;
  entries(): IterableIterator<[string, string]>;
}

/** The shape we narrow the raw ofetch response to when requesting streams */
export interface OfetchRawResponse {
  status: number;
  headers: OfetchHeaders;
  body: ReadableStream<Uint8Array> | null;
}
