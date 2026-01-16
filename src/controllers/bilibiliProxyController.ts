import { Get, Route, Request, Tags } from '@/tsoa';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Readable } from 'stream';
import { ApiResponse } from '../types/express';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { BaseController } from './baseController';
import { ofetchRawStream } from '../utils/ofetch';

const pipelineAsync = promisify(pipeline);

function extractHostFromUrl(urlString: string) {
  try {
    const urlObj = new URL(urlString);
    return urlObj.host; // 直接返回 host（包含端口）
  } catch (e) {
    console.error(' 无效的 URL:', e);
    return '';
  }
}

@Tags('B站视频代理')
@Route('proxy/bilibili')
export class BilibiliProxyController extends BaseController {
  /*
   * 代理转发B站视频流
   */
  @Get('stream')
  public async proxyBilibiliStream(@Request() req: ExpressRequest): Promise<ApiResponse | void> {
    try {
      const url = req.query.url as string;
      const bvid = req.query.bvid as string | undefined;
      const sign = req.query.sign as string | undefined;
      const platform = req.query.platform as string | undefined;
      const traceid = req.query.traceid as string | undefined;

      if (!url) {
        return this.fail('URL 参数不能为空', null, 400);
      }
      let newUrl = '';
      if (platform && sign) {
        newUrl = `${url}&sign=${sign}&platform=${platform}&traceid=${traceid}`;
      }

      const decodedUrl = decodeURIComponent(newUrl ? newUrl : url);

      let hostHeader = '';
      if (decodedUrl.includes('mcdn.bilivideo')) {
        hostHeader = extractHostFromUrl(decodedUrl);
      }

      const clientHeaders = req.headers;
      const headers: Record<string, string | string[]> = {
        Accept: clientHeaders.accept || '*/*',
        'Accept-Language': clientHeaders['accept-language'] || 'zh-CN,zh;q=0.9,en;q=0.8',
        Origin: clientHeaders.origin || 'https://www.bilibili.com',
        Referer: bvid ? `https://www.bilibili.com/video/${bvid}/` : clientHeaders.referer || 'https://www.bilibili.com/',
        'User-Agent': clientHeaders['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'sec-ch-ua': clientHeaders['sec-ch-ua'] || '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-mobile': clientHeaders['sec-ch-ua-mobile'] || '?0',
        'sec-ch-ua-platform': clientHeaders['sec-ch-ua-platform'] || '"Windows"',
        'Sec-Fetch-Dest': clientHeaders['sec-fetch-dest'] || 'empty',
        'Sec-Fetch-Mode': clientHeaders['sec-fetch-mode'] || 'cors',
        'Sec-Fetch-Site': clientHeaders['sec-fetch-site'] || 'cross-site',
        Priority: clientHeaders.priority || 'u=1, i',
        Connection: 'keep-alive',
      };
      if (hostHeader) {
        headers['Host'] = hostHeader;
      }

      if (clientHeaders['if-range']) {
        headers['If-Range'] = clientHeaders['if-range'] as string;
      }

      // Parse and validate Range header
      let rangeStart: number | undefined;
      let rangeEnd: number | undefined;

      const rangeHeader = req.headers.range as string | undefined;
      if (rangeHeader) {
        const rangeMatch = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
        if (!rangeMatch) {
          return this.fail('Range 请求头格式无效', null, 400);
        }
        rangeStart = parseInt(rangeMatch[1], 10);
        rangeEnd = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined;
        headers['Range'] = rangeHeader;
      }

      const response = await ofetchRawStream(decodedUrl, {
        method: 'GET',
        headers,
        responseType: 'stream',
        timeout: 15000,
      });

      if (response.status === 204) {
        console.error('❌ Bilibili returned 204 (missing Range?)');
        return this.fail('B 站返回204错误 (请检查Range头或Referer设置) ');
      }

      const res = req.res as ExpressResponse;
      if (!res) {
        return this.fail('响应对象不可用');
      }

      // Get content length from response headers
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : undefined;

      // Validate Range against content length
      if (rangeHeader && totalSize) {
        const end = rangeEnd && rangeEnd < totalSize ? rangeEnd : totalSize - 1;
        this.setHeader('Content-Range', `bytes ${rangeStart}-${end}/${totalSize}`);
        this.setHeader('Content-Length', (end - rangeStart! + 1).toString());
        res.status(206); // Partial Content
      } else {
        if (totalSize) {
          this.setHeader('Content-Length', totalSize.toString());
        }
        res.status(response.status);
      }

      // Set other response headers
      this.setHeader('Accept-Ranges', 'bytes');

      for (const [key, value] of response.headers.entries()) {
        if (key.toLowerCase() !== 'content-length' && key.toLowerCase() !== 'content-range') {
          this.setHeader(key, value);
        }
      }

      const nodeStream = Readable.fromWeb(response.body as any);
      await pipelineAsync(nodeStream, res);
    } catch (error) {
      console.error('代理错误:', error);
      return this.fail(`视频流传输失败: ${(error as Error).message}`);
    }
  }
}
