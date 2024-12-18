import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EmailController } from './controllers/email.controller';
import { EmailService } from './services/email.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EmailController],
  providers: [EmailService],
})
export class AppModule {}
