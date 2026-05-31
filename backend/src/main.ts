import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { MetaService } from './common/meta.service';
import { buildSwaggerConfig } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(MetaService)));

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`Petroldata API running on http://localhost:${port}/api/v1`);
  console.log(`Minerals API   running on http://localhost:${port}/api/v2/minerals`);
  console.log(`Swagger docs at  http://localhost:${port}/api/docs`);
}
bootstrap();
