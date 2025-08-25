import "reflect-metadata"
import { NextFunction, Request, Response, Router } from 'express'
import { container } from "tsyringe"
import { HttpStatus } from "../utils/http-status.js"
import _ from 'lodash'
import url from 'url'
import axios from 'axios'


function extractHost(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.host;
  } catch (error) {
    return '';
  }
}



class ProxyController {
  private readonly _router: Router = Router()
  //
  constructor() {
    this._configure()
  }

  //
  private _configure(): void {

    this._router.get('/video', async (req: Request, res: Response, next: NextFunction) => {
      const parsedUrl = url.parse(req.url, true);
      const targetUrlParam = parsedUrl.query.url;

      // Validate the 'url' parameter
      if (!targetUrlParam) {

        return res.status(400).json({ error: 'Missing "url" parameter. Use /?url=https://bunkr.site/path/to/video' });
      }

      const host = extractHost(targetUrlParam as string);

      // Decode and validate the URL
      let targetUrl;
      let parsedTargetUrl;
      try {
        targetUrl = decodeURIComponent(targetUrlParam as string);
        parsedTargetUrl = new URL(targetUrl);
        if (!parsedTargetUrl.hostname.toLowerCase().includes('bunkr')) {
          
          return res.status(400).json({ error: 'URL must be from bunkr.site domain' });
        }
      } catch (e) {
        
        return res.status(400).json({ error: `Invalid URL - ${targetUrlParam}` });
      }

      

      // Configure headers with Referer
      const headers = {
        Referer: 'https://bunkr.site',
        Host: host,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: '*/*',
      };

      

      try {

        const response = await axios({
          method: 'GET',
          url: targetUrl,
          headers,
          responseType: 'stream', // Stream the video content
        });

        // Extract filename from URL
        let filename = 'video_segment.ts'; // Default filename
        const pathSegments = parsedTargetUrl.pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment && lastSegment.endsWith('.ts')) {
          filename = lastSegment;
        }

        // Create response headers
        const responseHeaders = {
          'Content-Type': response.headers['content-type'],
          'Content-Length': response.headers['content-length'],
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': response.headers['cache-control'] || 'no-cache',
        };

        // Log Content-Type
        if (responseHeaders['Content-Type']) {
         
        }

        // Send the response
        res.status(response.status);
        for (const [key, value] of Object.entries(responseHeaders)) {
          if (value) res.setHeader(key, value);
        }
        response.data.pipe(res);

        // Handle stream errors
        response.data.on('error', (streamError) => {
          console.error(`[ERROR]: Stream error: ${streamError.message}`);
          res.status(500).json({ error: 'Stream error occurred' });
        });
        res.on('close', () => {
          
          response.data.destroy(); // Clean up the stream
        });
      } catch (error: any) {
        console.error(`[ERROR]: Proxy error: ${error.message}`, {
          url: targetUrl,
          stack: error.stack,
        });
        if (error.response) {
          
          return res.status(error.response.status).json({ error: `Failed to fetch resource: ${error.response.statusText}` });
        } else if (error.request) {
         
          return res.status(502).json({ error: 'No response from target server' });
        } else {
          
          return res.status(500).json({ error: `Proxy setup error: ${error.message}` });
        }
      }
    })
  }

  get router(): Router {
    return this._router
  }
}

export default new ProxyController().router