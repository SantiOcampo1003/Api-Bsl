import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../orders.service';
import { Order } from '../order.entity';

@Injectable()
export class MyCronService {
    constructor(private ordersService: OrdersService) {
    
    }
    @Cron('* * * * *')
    handleCron() {
       this.ordersService.synchronize()
       
    }
}
