import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AssetsModule } from './modules/assets/assets.module';
import { PrismaService } from './prisma.service';
import { MockAuthModule } from './modules/mock-auth/mock-auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [TicketsModule, AssetsModule, MockAuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
