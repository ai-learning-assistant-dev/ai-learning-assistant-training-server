/**
 * B站代理相关类型定义与请求校验 Schema
 */

import { z } from 'zod';

export interface BaseResponse<T> {
  code: number;
  message: string;
  ttl: number;
  data: T;
}

export interface WbiKeysResponse {
  img_key: string;
  sub_key: string;
}

export interface NavData {
  wbi_img: { img_url: string; sub_url: string };
}

export interface VideoViewData {
  cid: number;
  pages: Array<{ cid: number; page: number; part: string }>;
}

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
  segment_base: { index_range: string; initialization: string };
  start_with_sap?: number;
  size: number;
  audioSamplingRate?: number;
}

export interface VideoFormat {
  quality: number;
  format: string;
  new_description: string;
  display_desc: string;
}

export interface DashData {
  duration: number;
  timelength: number;
  minBufferTime: number;
  video: DashStream[];
  audio: DashStream[];
  supportFormats: VideoFormat[];
}

export interface FormatListItem {
  id: number;
  format?: string;
  quality?: number;
  display_desc?: string;
  new_description?: string;
  base_url?: string;
  backup_url?: string[];
  bandwidth?: number;
  mime_type?: string;
  codecs?: string;
  width?: number;
  height?: number;
  frame_rate?: string;
  sar?: string;
  segment_base?: { index_range: string; initialization: string };
  start_with_sap?: number;
  size?: number;
  audioSamplingRate?: number;
}

export interface PlayVideoData {
  timelength?: number;
  dash?: {
    timelength?: number;
    duration?: number;
    minBufferTime?: number;
    video?: DashStream[];
    audio?: DashStream[];
  };
  accept_quality?: number[];
  support_formats?: VideoFormat[];
  data?: {
    timelength?: number;
    accept_quality?: number[];
    support_formats?: VideoFormat[];
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

export type EncWbiParams = Record<string, string | number | boolean>;

export interface EncWbiResult {
  wts: number;
  w_rid: string;
}

export interface VideoManifestResponse {
  xml: string;
  pages: Array<{ cid: number; page: number; part: string }>;
}

export const mediaStreamQuerySchema = z.object({
  url: z.string().min(1),
  bvid: z.string().optional(),
});

export const dashQuerySchema = z.object({
  bvid: z.string().min(1),
  cid: z.string().optional(),
  p: z.string().optional(),
});
