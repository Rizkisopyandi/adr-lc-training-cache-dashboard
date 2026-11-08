import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gateway,session} from './server/vercelGateway.js';
dotenv.config();
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.basename(path.dirname(__filename))==='server-dist'?path.resolve(path.dirname(__filename),'..'):path.dirname(__filename);
const app=express(),PORT=process.env.PORT||3000;
app.use(express.json({limit:'4kb'}));
app.all('/api/session',(req,res)=>void session(req,res));
app.all('/api/executive',(req,res)=>void gateway(req,res));
app.all('/api/gas-proxy',(req,res)=>void gateway(req,res));
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      try {
        let template = await import('fs').then(fs => 
          fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        );
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[ADR Executive Server] Running on http://0.0.0.0:${PORT}`);
  });
}

export { app };

if (process.env.ADR_TEST_MODE !== '1') setupServer().catch(err => {
  console.error('[ADR Executive Server] Startup failure:', err);
});
