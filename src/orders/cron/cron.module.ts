import { Module } from '@nestjs/common';
import { MyCronService } from './cron.service';
import { OrdersModule } from '../orders.module';

@Module({
  imports : [OrdersModule],
  controllers: [],
  providers: [MyCronService,],
  exports: [MyCronService]
})
export class CronModule {}
