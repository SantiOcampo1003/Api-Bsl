import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdersService } from '../orders.service';

@Injectable()
export class MyCronService {
    constructor(private ordersService: OrdersService) {
    
    }
    @Cron('* * * * *')
    handleCron() {
       this.ordersService.synchronize()
       
    }
}
