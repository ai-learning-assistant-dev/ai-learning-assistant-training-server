import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { Readable } from 'node:stream';
import md5 from 'md5';
import { create } from 'xmlbuilder2';
import { ofetch } from 'ofetch';
import { ok, fail } from '@schemas/common';
import { ofetchRawStream, ofetchJson } from '@utils/ofetch';
import logger from '@utils/logger';
import type { BaseResponse, NavData, VideoViewData, PlayVideoData, WbiKeysResponse, DashData, DashStream, FormatListItem, EncWbiParams, EncWbiResult } from '@schemas/bilibili';

// ── WBI 签名工具 ────────────────────────────────────

/** WBI 签名用的混淆索引表，用于从原始 key 中按特定顺序提取字符生成混淆 key */
const mixinKeyEncTab: number[] = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51,
  30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

const getMixinKey = (orig: string): string =>
  mixinKeyEncTab
    .map(n => orig.charAt(n))
    .join('')
    .slice(0, 32);

/** 对请求参数进行 WBI 签名，生成 wts 时间戳和 w_rid 签名值 */
function encWbi(params: EncWbiParams, img_key: string, sub_key: string): EncWbiResult {
  const mixin_key = getMixinKey(img_key + sub_key);
  const curr_time = Math.floor(Date.now() / 1000);
  const chr_filter = /[!\(\)'\*]/g;
  Object.assign(params, { wts: curr_time });
  const query = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]).replace(chr_filter, ''))}`)
    .join('&');
  return { wts: curr_time, w_rid: md5(query + mixin_key) };
}

/** 从 B 站导航接口获取 WBI 签名所需的 img_key 和 sub_key */
async function getWbiKeys(sessdata?: string): Promise<WbiKeysResponse> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Referer: 'https://www.bilibili.com',
  };
  if (sessdata) headers.Cookie = `SESSDATA=${sessdata};`;

  const res = await ofetchJson<BaseResponse<NavData>>('https://api.bilibili.com/x/web-interface/nav', {
    method: 'GET',
    headers,
    timeout: 5000,
  });

  if (!res?.data?.wbi_img) throw new Error('Unable to obtain WBI keys');
  const img_key = res.data.wbi_img.img_url.split('/').pop()?.split('.')[0] ?? '';
  const sub_key = res.data.wbi_img.sub_url.split('/').pop()?.split('.')[0] ?? '';
  if (!img_key || !sub_key) throw new Error('Invalid WBI keys');
  return { img_key, sub_key };
}

// ── MPD 生成工具 ────────────────────────────────────

function extractHostFromUrl(urlString: string): string {
  try {
    return new URL(urlString).host;
  } catch {
    return '';
  }
}

function encodeUrlForQuery(url: string): string {
  try {
    if (decodeURIComponent(url) !== url) return url;
  } catch {}
  return encodeURIComponent(url);
}

function replaceProxyUrl(url: string, baseUrl: string, bvid: string): string {
  return `${baseUrl.replace(/\/$/, '')}/proxy/bilibili/stream?url=${encodeUrlForQuery(url)}&bvid=${encodeURIComponent(bvid)}`;
}

const sanitizeCodec = (val?: string) => (val ? val.replace(/["'\\]/g, '').trim() || undefined : undefined);
const sanitizeMime = (val?: string) => (val ? val.replace(/["'\\]/g, '').trim() || undefined : undefined);

/** 根据 DASH 数据生成 MPEG-DASH MPD 清单 XML，支持通过 videoIndex 指定视频流 */
function generateMPD(dashData: DashData, baseUrl: string, bvid: string, videoIndex?: number): string {
  const duration = dashData.duration || Math.floor((dashData.timelength || 0) / 1000);
  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('MPD', {
    xmlns: 'urn:mpeg:dash:schema:mpd:2011',
    type: 'static',
    mediaPresentationDuration: `PT${duration}S`,
    minBufferTime: `PT${dashData.minBufferTime || 1}S`,
    profiles: 'urn:mpeg:dash:profile:isoff-on-demand:2011',
  });
  const period = root.ele('Period', { duration: `PT${duration}S` });

  // Video
  const videoAS = period.ele('AdaptationSet', { segmentAlignment: 'true', subsegmentAlignment: 'true', subsegmentStartsWithSAP: '1' });
  let videoStreams = dashData.video || [];
  let preferred = typeof videoIndex === 'number' && videoIndex >= 0 ? videoStreams[videoIndex] : videoStreams.find(v => sanitizeCodec(v.codecs)?.startsWith('avc1.64'));
  if (preferred) videoStreams = [preferred];
  for (const v of videoStreams) addRepresentation(videoAS, v, baseUrl, bvid);

  // Audio
  const audioAS = period.ele('AdaptationSet', { segmentAlignment: 'true', subsegmentAlignment: 'true', subsegmentStartsWithSAP: '1' });
  let audioStreams = dashData.audio || [];
  const prefAudio = audioStreams.find(a => sanitizeCodec(a.codecs) === 'mp4a.40.2');
  if (prefAudio) audioStreams = [prefAudio];
  for (const a of audioStreams) addAudioRepresentation(audioAS, a, baseUrl, bvid);

  return root.end({ prettyPrint: true });
}

/** 生成统一的 MPD 清单，仅包含 AVC(H.264) 编码的视频流 */
function generateUnifiedMPD(dashData: DashData, baseUrl: string, bvid: string): string {
  const duration = dashData.duration || Math.floor((dashData.timelength || 0) / 1000);
  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('MPD', {
    xmlns: 'urn:mpeg:dash:schema:mpd:2011',
    type: 'static',
    mediaPresentationDuration: `PT${duration}S`,
    minBufferTime: `PT${dashData.minBufferTime || 1}S`,
    profiles: 'urn:mpeg:dash:profile:isoff-on-demand:2011',
  });
  const period = root.ele('Period', { duration: `PT${duration}S` });

  const videoAS = period.ele('AdaptationSet', { segmentAlignment: 'true', subsegmentAlignment: 'true', subsegmentStartsWithSAP: '1' });
  for (const v of (dashData.video || []).filter(v => sanitizeCodec(v.codecs)?.startsWith('avc1.64'))) addRepresentation(videoAS, v, baseUrl, bvid);

  const audioAS = period.ele('AdaptationSet', { segmentAlignment: 'true', subsegmentAlignment: 'true', subsegmentStartsWithSAP: '1' });
  let audioStreams = dashData.audio || [];
  const prefAudio = audioStreams.find(a => sanitizeCodec(a.codecs) === 'mp4a.40.2');
  if (prefAudio) audioStreams = [prefAudio];
  for (const a of audioStreams) addAudioRepresentation(audioAS, a, baseUrl, bvid);

  return root.end({ prettyPrint: true });
}

/** 向 MPD 的 AdaptationSet 中添加一个视频 Representation 节点 */
function addRepresentation(parent: any, stream: DashStream, baseUrl: string, bvid: string) {
  const attrs: Record<string, string> = { id: String(stream.id) };
  const mime = sanitizeMime(stream.mime_type);
  const codec = sanitizeCodec(stream.codecs);
  if (mime) attrs.mimeType = mime;
  if (codec) attrs.codecs = codec;
  if (stream.width) attrs.width = String(stream.width);
  if (stream.height) attrs.height = String(stream.height);
  if (stream.frame_rate) attrs.frameRate = String(stream.frame_rate);
  if (stream.sar) attrs.sar = String(stream.sar);
  if (stream.start_with_sap !== undefined) attrs.startWithSAP = String(stream.start_with_sap);
  if (stream.bandwidth !== undefined) attrs.bandwidth = String(stream.bandwidth);

  const rep = parent.ele('Representation', attrs);
  rep.ele('BaseURL').txt(replaceProxyUrl(stream.base_url, baseUrl, bvid));
  stream.backup_url?.forEach(u => rep.ele('BaseURL', { serviceLocation: 'backup' }).txt(replaceProxyUrl(u, baseUrl, bvid)));
  rep.ele('SegmentBase', { indexRange: stream.segment_base.index_range }).ele('Initialization', { range: stream.segment_base.initialization });
}

/** 向 MPD 的 AdaptationSet 中添加一个音频 Representation 节点 */
function addAudioRepresentation(parent: any, stream: DashStream, baseUrl: string, bvid: string) {
  const attrs: Record<string, string> = { id: String(stream.id) };
  const mime = sanitizeMime(stream.mime_type);
  const codec = sanitizeCodec(stream.codecs);
  if (mime) attrs.mimeType = mime;
  if (codec) attrs.codecs = codec;
  if (stream.start_with_sap !== undefined) attrs.startWithSAP = String(stream.start_with_sap);
  if (stream.bandwidth !== undefined) attrs.bandwidth = String(stream.bandwidth);
  if (stream.audioSamplingRate !== undefined) attrs.audioSamplingRate = String(stream.audioSamplingRate);

  const rep = parent.ele('Representation', attrs);
  rep.ele('AudioChannelConfiguration', { schemeIdUri: 'urn:mpeg:dash:23003:3:audio_channel_configuration:2011', value: '2' });
  rep.ele('BaseURL').txt(replaceProxyUrl(stream.base_url, baseUrl, bvid));
  stream.backup_url?.forEach(u => rep.ele('BaseURL', { serviceLocation: 'backup' }).txt(replaceProxyUrl(u, baseUrl, bvid)));
  rep.ele('SegmentBase', { indexRange: stream.segment_base.index_range }).ele('Initialization', { range: stream.segment_base.initialization });
}

/** 从 DASH 数据中提取可用的视频格式列表（清晰度、编码等信息） */
function generateFormatList(dashData: DashData): FormatListItem[] {
  const list: FormatListItem[] = dashData.supportFormats.map(v => ({
    id: v.quality,
    format: v.format,
    new_description: v.new_description,
    display_desc: v.display_desc,
  }));
  for (const v of dashData.video || []) {
    if (sanitizeCodec(v.codecs)?.startsWith('avc1.64')) {
      const item = list.find(i => i.id === v.id);
      if (item) Object.assign(item, v);
      else list.push({ ...v });
    }
  }
  return list;
}

/**
 * 通过 B 站接口获取视频的 DASH 流信息，包含视频/音频流地址及元数据
 * 先查询视频 cid，再使用 WBI 签名请求播放地址
 */
async function getDashInfo(bvid: string, sessdata?: string, cid?: number) {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Referer: 'https://www.bilibili.com',
    Cookie: sessdata ? `SESSDATA=${sessdata}` : '',
  };

  const viewRes = await ofetchJson<BaseResponse<VideoViewData>>(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`, {
    method: 'GET',
    headers,
    timeout: 5000,
  });

  let paramsCid = cid ?? viewRes?.data?.cid;
  if (!paramsCid) throw new Error('Failed to fetch video cid');

  const { img_key, sub_key } = await getWbiKeys(sessdata);
  let params: EncWbiParams = { bvid, cid: paramsCid, fnval: 80, fnver: 0, fourk: 1 };
  const sign = encWbi(params, img_key, sub_key);
  params = { ...params, ...sign };

  const playRes = await ofetchJson<BaseResponse<PlayVideoData>>('https://api.bilibili.com/x/player/wbi/playurl', {
    method: 'GET',
    headers,
    query: params,
    timeout: 5000,
  });

  const supportFormats = playRes?.data?.support_formats ?? playRes?.data?.data?.support_formats;
  const dash = playRes?.data?.dash ?? playRes?.data?.data?.dash;
  if (!dash?.video?.length || !dash?.audio?.length) throw new Error('Unable to obtain DASH playurl');

  const timelength = dash.timelength ?? playRes.data?.timelength ?? 0;
  return {
    pages: viewRes.data.pages,
    dash: {
      ...dash,
      video: [...dash.video].sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0)),
      audio: [...dash.audio].sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0)),
      supportFormats,
      duration: dash.duration ?? Math.floor(timelength / 1000),
      minBufferTime: dash.minBufferTime ?? 1,
      timelength,
    } as DashData,
  };
}

function getCookieValue(cookieString: string, name: string): string {
  if (!cookieString) return '';
  for (const c of cookieString.split(';')) {
    const [k, v] = c.trim().split('=');
    if (k === name) return v ?? '';
  }
  return '';
}

function handleCookie(cookie: string): string | undefined {
  const parts = cookie.split(';').map(p => p.trim());
  if (!parts[0]?.startsWith('SESSDATA=')) return cookie;

  const props = new Map<string, string>();
  for (const part of parts) {
    const [key, value] = part.split('=', 2).map(s => s!.trim());
    if (value !== undefined) props.set(key!, value);
  }
  const val = props.get('SESSDATA');
  if (!val) return undefined;

  const result = [`SESSDATA=${val}`];
  for (const attr of ['Path', 'Expires']) {
    const v = props.get(attr);
    if (v) result.push(`${attr}=${v}`);
  }
  result.push('HttpOnly', 'SameSite=Lax');
  return result.join('; ');
}

// ── Hono 路由 ───────────────────────────────────────

const app = new Hono();

// ── GET /stream — 代理视频流 ────────────────────────

/** 代理 B 站视频/音频流请求，处理 Range 分段下载和 CDN 域名转发 */
app.get(
  '/stream',
  describeRoute({
    tags: ['B站代理'],
    summary: '代理 B 站视频/音频流请求，处理 Range 分段下载和 CDN 域名转发',
  }),
  async c => {
    const url = c.req.query('url');
    const bvid = c.req.query('bvid') ?? '';
    const sign = c.req.query('sign');
    const platform = c.req.query('platform');
    const traceid = c.req.query('traceid');

    if (!url) return c.json(fail('URL 参数不能为空'), 400);

    let finalUrl = platform && sign ? `${url}&sign=${sign}&platform=${platform}&traceid=${traceid}` : url;
    const decodedUrl = decodeURIComponent(finalUrl);

    let hostHeader = '';
    if (decodedUrl.includes('mcdn.bilivideo')) hostHeader = extractHostFromUrl(decodedUrl);

    const headers: Record<string, string> = {
      Accept: c.req.header('accept') || '*/*',
      'Accept-Language': c.req.header('accept-language') || 'zh-CN,zh;q=0.9',
      Origin: c.req.header('origin') || 'https://www.bilibili.com',
      Referer: bvid ? `https://www.bilibili.com/video/${bvid}/` : c.req.header('referer') || 'https://www.bilibili.com/',
      'User-Agent': c.req.header('user-agent') || 'Mozilla/5.0',
      Connection: 'keep-alive',
    };
    if (hostHeader) headers['Host'] = hostHeader;
    if (c.req.header('if-range')) headers['If-Range'] = c.req.header('if-range')!;

    const rangeHeader = c.req.header('range');
    let rangeStart: number | undefined;
    let rangeEnd: number | undefined;
    if (rangeHeader) {
      const m = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
      if (!m) return c.json(fail('Range 请求头格式无效'), 400);
      rangeStart = parseInt(m[1]!, 10);
      rangeEnd = m[2] ? parseInt(m[2], 10) : undefined;
      headers['Range'] = rangeHeader;
    }

    const response = await ofetchRawStream(decodedUrl, { method: 'GET', headers, responseType: 'stream', timeout: 15000 });
    if (response.status === 204) return c.json(fail('B 站返回 204 错误'), 502);

    // 构建响应头
    const respHeaders = new Headers();
    respHeaders.set('Accept-Ranges', 'bytes');
    for (const [key, value] of response.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower !== 'content-length' && lower !== 'content-range') {
        respHeaders.set(key, value);
      }
    }

    const contentLength = response.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength, 10) : undefined;
    let statusCode = response.status;

    if (rangeHeader && totalSize && rangeStart !== undefined) {
      const end = rangeEnd !== undefined && rangeEnd < totalSize ? rangeEnd : totalSize - 1;
      respHeaders.set('Content-Range', `bytes ${rangeStart}-${end}/${totalSize}`);
      respHeaders.set('Content-Length', String(end - rangeStart + 1));
      statusCode = 206;
    } else if (totalSize) {
      respHeaders.set('Content-Length', String(totalSize));
    }

    return new Response(response.body, { status: statusCode, headers: respHeaders });
  },
);

// ── GET /captcha — 获取验证码 ───────────────────────

/** 代理请求 B 站登录验证码接口 */
app.get(
  '/captcha',
  describeRoute({
    tags: ['B站代理'],
    summary: '代理请求 B 站登录验证码接口',
  }),
  async c => {
    try {
      const res = await ofetch('https://passport.bilibili.com/x/passport-login/captcha?source=main_web');
      return c.json(ok(res, '获取验证码成功'));
    } catch {
      return c.json(fail('获取验证码失败'));
    }
  },
);

// ── POST /sms — 发送短信验证码 ──────────────────────

/** 代理请求 B 站短信验证码发送接口，需携带人机验证参数 */
app.post(
  '/sms',
  describeRoute({
    tags: ['B站代理'],
    summary: '代理请求 B 站短信验证码发送接口，需携带人机验证参数',
  }),
  async c => {
    const params = await c.req.json();
    const userAgent = c.req.header('user-agent') || '';
    const body = new URLSearchParams();
    body.append('source', params.source);
    body.append('tel', params.tel);
    body.append('cid', String(params.cid));
    body.append('validate', params.validate);
    body.append('token', params.token);
    body.append('seccode', params.seccode);
    body.append('challenge', params.challenge);

    try {
      const res = await ofetch('https://passport.bilibili.com/x/passport-login/web/sms/send', {
        method: 'POST',
        headers: {
          accept: '*/*',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'content-type': 'application/x-www-form-urlencoded',
          origin: 'https://www.bilibili.com',
          Host: 'passport.bilibili.com',
          priority: 'u=1, i',
          referer: 'https://www.bilibili.com/',
          'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': userAgent,
        },
        body,
      } as any);
      return c.json(ok(res, '短信发送成功'));
    } catch (error) {
      return c.json(fail('短信发送失败'));
    }
  },
);

// ── POST /login — 短信登录 ──────────────────────────

/** 代理 B 站短信登录接口，登录成功后提取并转发 SESSDATA Cookie */
app.post(
  '/login',
  describeRoute({
    tags: ['B站代理'],
    summary: '代理 B 站短信登录接口，登录成功后提取并转发 SESSDATA Cookie',
  }),
  async c => {
    const params = await c.req.json();
    const body = new URLSearchParams();
    body.append('source', params.source);
    body.append('tel', params.tel);
    body.append('code', params.code);
    body.append('keep', params.keep ? 'true' : 'false');
    body.append('go_url', params.go_url);
    body.append('cid', String(params.cid));
    body.append('captcha_key', params.captcha_key);

    try {
      const resRaw = await ofetch.raw('https://passport.bilibili.com/x/passport-login/web/login/sms', {
        method: 'POST',
        headers: {
          accept: '*/*',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'content-type': 'application/x-www-form-urlencoded',
          origin: 'https://www.bilibili.com',
          priority: 'u=1, i',
          referer: 'https://www.bilibili.com/',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        },
        body,
      } as any);

      const setCookies = (resRaw as any)?.headers?.get?.('set-cookie');
      if (setCookies) {
        const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
        for (const cookie of arr) {
          const processed = handleCookie(cookie);
          if (processed) c.header('set-cookie', processed);
        }
      }

      return c.json(ok((resRaw as any)._data, '登录成功'));
    } catch (error) {
      return c.json(fail('登录失败'));
    }
  },
);

// ── GET /video-manifest — 生成 DASH 清单 ────────────

/** 根据 bvid 获取视频 DASH 信息，生成 MPD 清单 XML、格式列表和统一 MPD */
app.get(
  '/video-manifest',
  describeRoute({
    tags: ['B站代理'],
    summary: '根据 bvid 获取视频 DASH 信息，生成 MPD 清单 XML、格式列表和统一 MPD',
  }),
  async c => {
    const bvid = c.req.query('bvid');
    const cidParam = c.req.query('cid');
    const pParam = c.req.query('p');

    if (!bvid?.trim()) return c.json(fail('bvid parameter is required'), 400);

    const host = c.req.header('host') || process.env.HOST || 'localhost:3000';
    const proto = c.req.header('x-forwarded-proto') || 'http';
    let baseUrl = `${proto}://${host}`;
    if (proto === 'http' && host.includes(':443')) baseUrl = `https://${host.split(':')[0]}`;

    const cookie = c.req.header('cookie') || '';
    const sessdata = getCookieValue(cookie, 'SESSDATA');
    const cid = cidParam ? parseInt(cidParam, 10) : undefined;

    let dashInfo = await getDashInfo(bvid, sessdata, cid);
    if (pParam && dashInfo.pages) {
      const p = parseInt(pParam, 10);
      const pageCid = dashInfo.pages[p - 1]?.cid;
      if (pageCid) dashInfo = await getDashInfo(bvid, sessdata, pageCid);
    }

    const xmlResult = generateMPD(dashInfo.dash, baseUrl + '/api', bvid);
    const formatList = generateFormatList(dashInfo.dash);
    const unifiedMpd = generateUnifiedMPD(dashInfo.dash, baseUrl + '/api', bvid);

    return c.json(ok({ xml: xmlResult, formatList, unifiedMpd, pages: dashInfo.pages }));
  },
);

export default app;
