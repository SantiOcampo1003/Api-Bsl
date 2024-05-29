import { Controller, Post, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { Order } from './order.entity';
import { ApiTags, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('orders') // Agrupa los endpoints en Swagger bajo 'orders'
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post('load-data')
    @ApiOperation({ summary: 'Carga de datos de órdenes' })
    @ApiBody({ type: [CreateOrderDto] })
    @ApiResponse({ status: 201, description: 'Datos cargados correctamente.' })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    async processLoadData(@Body() orders: CreateOrderDto[]): Promise<Order[]> {
        return await this.ordersService.processLoadData(orders);
    }

    @Post('hubspot/update-or-insert-contact')
    @ApiOperation({ summary: 'Actualizar o insertar contacto en HubSpot' })
    @ApiBody({ type: [Order] })
    @ApiResponse({ status: 201, description: 'Contacto actualizado o insertado correctamente en HubSpot.' })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
    async updateOrInsertHubspotContact(@Body() order: Order[]): Promise<any> {
      try {
        await this.ordersService.processRequest(order);
        return { message: 'Contacto actualizado o insertado correctamente en HubSpot' };
      } catch (error) {
        return { error: 'Ocurrió un error al actualizar o insertar el contacto en HubSpot' };
      }
    }
}
