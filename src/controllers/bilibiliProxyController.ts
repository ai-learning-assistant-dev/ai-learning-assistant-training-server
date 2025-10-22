import { Get, Query, Route, Request, Tags } from 'tsoa';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Readable } from 'stream';
import { ApiResponse } from '../types/express';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { BaseController } from './baseController';
import { ofetchRawStream } from '../utils/ofetch';

const pipelineAsync = promisify(pipeline);

@Tags('B站视频代理')
@Route('proxy/bilibili')
export class BilibiliProxyController extends BaseController {
  /*
   * 代理转发B站视频流
   */
  @Get('stream')
  public async proxyBilibiliStream(
    @Query() url: string,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse | void> {
    try {
      if (!url) {
        return this.fail('URL 参数不能为空', null, 400);
      };

      const decodedUrl = decodeURIComponent(url);
      if (!/^https:\/\/[\w.-]*bilivideo\.com\//.test(decodedUrl)) {
        return this.fail('非法的B站视频域名', null, 400);
      }

      const headers: Record<string, string> = {
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
      };

      // Parse and validate Range header
      let rangeStart: number | undefined;
      let rangeEnd: number | undefined;
      const rangeHeader = req.headers.range;
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
