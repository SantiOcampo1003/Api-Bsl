import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './orders/cron/cron.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:`.${process.env.NODE_ENV.trim()}.env`, 
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'orders',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true
    }),
    OrdersModule,
    CronModule,
    ScheduleModule.forRoot(),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }