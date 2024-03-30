import { Controller, Post, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { Order } from './order.entity';

@Controller('orders') // El prefijo de la ruta para todos los endpoints de este controlador
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post('load-data') // El endpoint POST para cargar datos
    async processLoadData(@Body() orders: CreateOrderDto[]): Promise<Order[]> {
        return await this.ordersService.processLoadData(orders);
    }
    @Post('hubspot/update-or-insert-contact')
    async updateOrInsertHubspotContact(@Body() order: Order[]): Promise<any> {
      try {
        await this.ordersService.processRequest(order);
        return { message: 'Contacto actualizado o insertado correctamente en HubSpot' };
      } catch (error) {
        return { error: 'Ocurrió un error al actualizar o insertar el contacto en HubSpot' };
      }
    }
  }