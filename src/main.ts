import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any properties sent by the client that aren't in the DTO
      forbidNonWhitelisted: true, // Throws an error if the client sends extra rogue data
      transform: true, // Automatically transforms payloads to be objects typed according to their DTO classes
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
