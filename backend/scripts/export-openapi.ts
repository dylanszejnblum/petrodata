import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { buildSwaggerConfig } from '../src/swagger.config';

async function main() {
  const log = new Logger('export-openapi');

  // Boot the Nest app without listening on a port — we only need it for metadata.
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());

  const outPath = resolve(__dirname, '..', 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2) + '\n', 'utf8');

  log.log(`Wrote OpenAPI spec → ${outPath}`);
  log.log(`Routes: ${Object.keys(document.paths).length}`);
  log.log(`Schemas: ${Object.keys(document.components?.schemas ?? {}).length}`);

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
