import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load .env
    MongooseModule.forRoot(process.env.MONGODB_URI), // Connect to MongoDB
  ],
  exports: [MongooseModule], // Export MongooseModule for use in other modules
})
export class DatabaseModule {}
