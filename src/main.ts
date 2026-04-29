import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as dns from 'dns';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';


dns.setDefaultResultOrder('ipv4first');
import { AppModule } from './app.module';
import { HttpErrorFilter } from './filters/http-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',  // Routes become /api/v1/..., /api/v2/..., etc.
  });

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true, 
  });
  app.use(cookieParser());
  app.use(csurf({ cookie: true }));
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://0.0.0.0:${port}`);
}

bootstrap();
