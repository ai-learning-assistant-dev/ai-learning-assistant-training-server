import { Controller, Get, Query, Route, Request, Res, TsoaResponse, Tags } from 'tsoa';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Readable } from 'stream';
import { ofetch } from 'ofetch';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

@Tags('B站视频代理')
@Route('proxy/bilibili')
export class BilibiliProxyController extends Controller {
  /*
   * 代理转发B站视频流
   */
  @Get('stream')
  public async proxyBilibiliStream(
    @Query() url: string,
    @Request() req: ExpressRequest,
    @Res() badRequest: TsoaResponse<400, { error: string }>,
    @Res() serverError: TsoaResponse<500, { error: string }>
  ): Promise<void> {
    try {
      if (!url) return badRequest(400, { error: 'URL is required' });

      const decodedUrl = decodeURIComponent(url);
      if (!/^https:\/\/[\w.-]*bilivideo\.com\//.test(decodedUrl)) {
        return badRequest(400, { error: 'Invalid Bilibili video domain' });
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
          return badRequest(400, { error: 'Invalid Range header format' });
        }
        rangeStart = parseInt(rangeMatch[1], 10);
        rangeEnd = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined;
        headers['Range'] = rangeHeader;
      }

      const response = await ofetch.raw(decodedUrl, {
        method: 'GET',
        headers,
        responseType: 'stream',
        timeout: 15000,
      });

      if (response.status === 204) {
        console.error('❌ Bilibili returned 204 (missing Range?)');
        return serverError(500, { error: 'Bilibili returned 204 (check Range/Referer)' });
      }

      const res = req.res as ExpressResponse;
      if (!res) {
        return serverError(500, { error: 'Response object not available' });
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
      console.error('Proxy error:', error);
      serverError(500, { error: `Streaming failed: ${(error as Error).message}` });
    }
  }
}
