import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { MetaService } from './common/meta.service';
import { buildSwaggerConfig } from './swagger.config';

async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableCors();
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
