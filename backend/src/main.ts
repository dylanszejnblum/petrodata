import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import compression = require('compression');
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { MetaService } from './common/meta.service';
import { buildSwaggerConfig } from './swagger.config';

async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // El pipeline de noticias POSTea lotes de hasta 200 documentos a
  // /api/v1/news/ingest; con el texto completo cada documento pesa ~7 KB, así que
  // un lote real ronda los 700 KB. El parser JSON por defecto de Express corta en
  // 100 KB y desde mediados de septiembre el ingest venía devolviendo 500
  // (PayloadTooLargeError) — o sea que el pipeline no publicaba nada y el cron
  // sólo anotaba "run FAILED". 8 MB cubre el tope de 500 documentos del DTO con
  // margen. Registrarlo acá reemplaza al default: Nest no instala el suyo porque
  // `isMiddlewareApplied('jsonParser')` ya lo encuentra (express.json() devuelve
  // una función con ese nombre).
  // Los 8 MB son sólo para el ingest (que exige token): el resto corta en 100 KB
  // antes de parsear, para que nadie haga leer 8 MB a la API desde una ruta pública.
  // ponytail: mira Content-Length; un body chunked sin largo sigue topado en 8 MB
  app.use((req: IncomingMessage & { path: string }, res: ServerResponse, next: () => void) => {
    if (Number(req.headers['content-length'] ?? 0) > 100_000 && req.path !== '/api/v1/news/ingest') {
      res.writeHead(413, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Body too large' } }));
      return;
    }
    next();
  });
  app.useBodyParser('json', { limit: '8mb' });

  // Behind Coolify's Traefik proxy: trust X-Forwarded-For so req.ip is the real
  // client (per-IP rate limiting buckets everyone together otherwise).
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(compression());
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  // Browser CORS is only for our own frontend; third-party API consumers call
  // server-to-server with a key (no Origin header, unaffected by this). Allowlist
  // from CORS_ORIGINS (comma-separated); falls back to the known app origins.
  const corsOrigins = (
    process.env.CORS_ORIGINS ??
    // Sólo los dominios publicados: sin localhost, a propósito. Las lecturas de
    // cualquier frontend son del servidor y no pasan por acá; lo que sí pasa es
    // el POST de /directivos/:slug/voto, que sale del navegador. Un origen que
    // falte no da error visible: el preflight vuelve sin header y el voto se
    // pierde en silencio.
    // OJO: en producción CORS_ORIGINS ESTÁ seteada, así que esta lista no corre
    // allá. Tocar las dos.
    'https://vacamuerta.io,https://www.vacamuerta.io,https://old.vacamuerta.io,https://v1.vacamuerta.io,https://v2.vacamuerta.io,https://petrodata.dylansz.com'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  // Sin credentials: la API no usa cookies ni auth de navegador.
  app.enableCors({ origin: corsOrigins, credentials: false });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseInterceptor(app.get(MetaService), app.get(Reflector)),
  );

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  return app;
}

// Serverless (Vercel): build the Nest app once per cold start and reuse the
// underlying Express instance across invocations. `init()` wires everything up
// without binding a port (which serverless functions must not do).
type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

let cachedServer: Promise<NodeHandler> | null = null;

function getServer(): Promise<NodeHandler> {
  if (!cachedServer) {
    cachedServer = createApp().then(async (app) => {
      await app.init();
      return app.getHttpAdapter().getInstance() as unknown as NodeHandler;
    });
  }
  return cachedServer;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await getServer();
  server(req, res);
}

// Local / long-running process: actually listen on a port.
if (!process.env.VERCEL) {
  void createApp().then(async (app) => {
    const port = Number(process.env.PORT) || 3001;
    await app.listen(port);
    console.log(`Petroldata API running on http://localhost:${port}/api/v1`);
    console.log(`Minerals API   running on http://localhost:${port}/api/v2/minerals`);
    console.log(`Swagger docs at  http://localhost:${port}/api/docs`);
  });
}
