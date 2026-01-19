import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function main() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({whitelist: true}));

  app.enableCors({
    origin: ['http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = new DocumentBuilder()
      .setTitle('Документация DocuWiki')
      .setDescription('DocuWiki - приложение для заметок, в котором вы можете сохранять фрагменты' +
          ' своего кодаи не только с понятным для вас объяснением, удобно и структурированно' +
          ' хранить их в приложении')
      .setVersion('1.0')
      .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docuWiki', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
main();
