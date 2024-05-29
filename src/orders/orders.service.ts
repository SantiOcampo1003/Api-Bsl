import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/createOrder.dto';
import { Client } from '@hubspot/api-client';
import { PublicObjectSearchRequest } from '@hubspot/api-client/lib/codegen/crm/contacts';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersService {
    private hubspotClient: Client;
    constructor(@InjectRepository(Order) private orderRepository: Repository<Order>, private configService: ConfigService,) {
        const accessToken = this.configService.get<string>('HUBSPOT_ACCESS_TOKEN'); 
        if (!accessToken) {
            throw new Error('HubSpot access token not found in environment variables');
        }

        this.hubspotClient = new Client({ accessToken });
    }

    async processLoadData(orders: CreateOrderDto[]): Promise<Order[]> {
        const processedOrders: Order[] = [];

        for (const orderDto of orders) {
            const existingOrder = await this.orderRepository.findOne({ where: { guia: orderDto.guia } });

            if (existingOrder) {
                // Si la orden existe, actualizamos sus campos
                existingOrder.pedido = orderDto.pedido;
                existingOrder.Cc = orderDto.Cc;
                existingOrder.nombresDestinatario = orderDto.nombresDestinatario;
                existingOrder.direccionEntrega = orderDto.direccionEntrega;
                existingOrder.direccionRemitente = orderDto.direccionRemitente;
                existingOrder.departamento = orderDto.departamento;
                existingOrder.ciudadDestino = orderDto.ciudadDestino;
                existingOrder.telefono = orderDto.telefono;
                existingOrder.tipoProducto = orderDto.tipoProducto;
                existingOrder.fechaProd = orderDto.fechaProd;
                existingOrder.fechaEntrega = orderDto.fechaEntrega;
                existingOrder.estadosLogistico = orderDto.estadosLogistico;
                existingOrder.novedades = orderDto.novedades;
                existingOrder.descripcionNovedad = orderDto.descripcionNovedad;
                existingOrder.fechaNovedad = orderDto.fechaNovedad;
                existingOrder.ultimoMensajeroEnReparto = orderDto.ultimoMensajeroEnReparto;
                existingOrder.notas1 = orderDto.notas1;
                existingOrder.notas2 = orderDto.notas2;
                existingOrder.contenido = orderDto.contenido;
                existingOrder.cuenta = orderDto.cuenta;
                existingOrder.centroDeCostos = orderDto.centroDeCostos;
                existingOrder.fechaImagen = orderDto.fechaImagen;
                existingOrder.imagenGuia = orderDto.imagenGuia;
                existingOrder.novedadesPorGuia = orderDto.novedadesPorGuia;
                existingOrder.fechaNovedades = orderDto.fechaNovedades;
                existingOrder.updatedOrder = true; // Marcamos como actualizado
                const updatedOrder = await this.orderRepository.save(existingOrder);
                processedOrders.push(updatedOrder);
            } else {
                // Si la orden no existe, creamos una nueva
                const newOrder = await this.orderRepository.create(this.createOrderEntity(orderDto));
                const savedOrder = await this.orderRepository.save(newOrder);
                processedOrders.push(savedOrder);
            }
        }

        return processedOrders;
    }

    async updateOrInsertHubspotContact(order: Order): Promise<void> {
        try {
            if (order && order.guia) {
                const searchRequest: PublicObjectSearchRequest = {
                    filterGroups: [
                        {
                            filters: [
                                {
                                    propertyName: 'numero_de_guia',
                                    operator: FilterOperatorEnum.Eq,
                                    value: order.guia.toString()
                                }
                            ]
                        }
                    ],
                    properties: ['numero_de_guia'], // Propiedades que deseas obtener en la respuesta
                    limit: 1,// Limitamos la búsqueda a 1 resultado ya que solo necesitamos verificar si existe al menos un contacto con el mismo número de guía
                    after: null, // Agregar la propiedad 'after'
                    sorts: null
                };

                // Realizamos la búsqueda en HubSpot
                let searchResponse = null;

                searchResponse = await this.hubspotClient.crm.contacts.searchApi.doSearch(searchRequest)
                    .catch(er => {
                        console.error(er?.message);
                        return null;
                    });


                // Verificamos si hay algún resultado
                if (searchResponse && searchResponse.total) {
                    // Si se encuentra al menos un contacto con la misma guía, actualizamos los datos en HubSpot
                    const existingContact = searchResponse.results[0]; // No necesitamos limitar a [0] ya que la búsqueda se limita a 1 resultado
                    const updatedContactData = this.prepareContactDataForUpdate(order);
                    await this.hubspotClient.crm.contacts.basicApi.update(existingContact.id, { properties: updatedContactData });
                    await this.markAsSynchronized(order);
                    console.log("Contacto actualizado en HubSpot con exito!", order.guia);
                } else {
                    // Si no se encuentra ningún contacto con la misma guía, creamos un nuevo contacto en HubSpot
                    const newContactData = this.prepareContactDataForCreation(order);
                    await this.hubspotClient.crm.contacts.basicApi.create({ properties: newContactData, associations: [] });
                    await this.markAsSynchronized(order);
                    console.log("Contacto creado en HubSpot con exito!", order.guia);
                }
            }
        } catch (error) {
            console.error('Error updating or inserting HubSpot contact:', error);
            throw error; // Re-lanza el error para que sea manejado en otra parte si es necesario
        }
    }

    async markAsSynchronized(order: Order): Promise<void> {
        try {
            // Realiza la actualización del campo synchronized a true en tu base de datos local
            order.synchronized = true;
            order.updatedOrder = false;
            await this.orderRepository.save(order);
        } catch (error) {
            console.error('Error marking order as synchronized:', error);
            throw error;
        }
    }

    /**
     * 
     * @param order 
     * @returns 
     */
    async processRequest(order: Order[]) {
        for (let index = 0; index < order.length; index++) {
            const element = order[index];
            await this.updateOrInsertHubspotContact(element)
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return true;
    }

    async synchronize() {
        try {
            const synchronizedFields = await this.orderRepository.find({
                where: [
                    { synchronized: false },
                    { updatedOrder: true }
                ]
            });


            await this.processRequest(synchronizedFields);

        } catch (error) {
            console.error('Error synchronizing data:', error);
            throw error;
        }

    }



    private prepareContactDataForUpdate(order: Order): any {
        // Prepara los datos del contacto para actualizar en HubSpot según lo necesites
        // Mapea los campos según la homologación   
        const toUtcMidnight = (date: Date): number => {
            const utcDate = new Date(date);
            utcDate.setUTCHours(0, 0, 0, 0);
            return utcDate.getTime();
        };
        return {
            numero_de_pedido: order.pedido,
            numero_de_guia: order.guia,
            numero_de_documento: order.Cc,
            firstname: order.nombresDestinatario,
            address: order.direccionEntrega,
            direccion_remitente: order.direccionRemitente,
            departamento: order.departamento,
            city: order.ciudadDestino,
            hs_whatsapp_phone_number: order.telefono,
            phone: order.telefono,
            fecha_cargue_de_base: toUtcMidnight(order.fechaProd),
            fecha_de_entrega: toUtcMidnight(order.fechaEntrega),
            fecha_de_entrega_programada: toUtcMidnight(order.fechaEntrega), // Se asume que es la misma fecha que la de entrega
            estado_logistico: order.estadosLogistico,
            novedades: order.novedades,
            descripcion_de_novedades: order.descripcionNovedad,
            fecha_de_novedad: toUtcMidnight(order.fechaNovedad),
            repartidor_asigado: order.ultimoMensajeroEnReparto,
            notas_del_envio: order.notas1 || order.notas2,
            campana: order.centroDeCostos,
            fecha_de_imagen: toUtcMidnight(order.fechaImagen),
        };
    }

    private prepareContactDataForCreation(order: Order): any {

        // Prepara los datos del nuevo contacto para crear en HubSpot según lo necesites
        // Mapea los campos según la homologación
        const toUtcMidnight = (date: Date): number => {
            const utcDate = new Date(date);
            utcDate.setUTCHours(0, 0, 0, 0);
            return utcDate.getTime();
        };
        return {
            numero_de_pedido: order.pedido,
            numero_de_guia: order.guia,
            numero_de_documento: order.Cc,
            firstname: order.nombresDestinatario,
            address: order.direccionEntrega,
            direccion_remitente: order.direccionRemitente,
            departamento: order.departamento,
            city: order.ciudadDestino,
            hs_whatsapp_phone_number: order.telefono,
            phone: order.telefono,
            fecha_cargue_de_base: toUtcMidnight(order.fechaProd),
            fecha_de_entrega: toUtcMidnight(order.fechaEntrega),
            fecha_de_entrega_programada: toUtcMidnight(order.fechaEntrega),
            estado_logistico: order.estadosLogistico,
            novedades: order.novedades,
            descripcion_de_novedades: order.descripcionNovedad,
            fecha_de_novedad: toUtcMidnight(order.fechaNovedad),
            repartidor_asigado: order.ultimoMensajeroEnReparto,
            notas_del_envio: order.notas1 || order.notas2,
            campana: order.centroDeCostos,
            fecha_de_imagen: toUtcMidnight(order.fechaImagen),
        };
    }


    private createOrderEntity(orderDto: CreateOrderDto): Order {
        const orderEntity = new Order();
        orderEntity.pedido = orderDto.pedido;
        orderEntity.guia = orderDto.guia;
        orderEntity.Cc = orderDto.Cc;
        orderEntity.nombresDestinatario = orderDto.nombresDestinatario;
        orderEntity.direccionEntrega = orderDto.direccionEntrega;
        orderEntity.direccionRemitente = orderDto.direccionRemitente;
        orderEntity.departamento = orderDto.departamento;
        orderEntity.ciudadDestino = orderDto.ciudadDestino;
        orderEntity.telefono = orderDto.telefono;
        orderEntity.tipoProducto = orderDto.tipoProducto;
        orderEntity.fechaProd = orderDto.fechaProd;
        orderEntity.fechaEntrega = orderDto.fechaEntrega;
        orderEntity.estadosLogistico = orderDto.estadosLogistico;
        orderEntity.novedades = orderDto.novedades;
        orderEntity.descripcionNovedad = orderDto.descripcionNovedad;
        orderEntity.fechaNovedad = orderDto.fechaNovedad;
        orderEntity.ultimoMensajeroEnReparto = orderDto.ultimoMensajeroEnReparto;
        orderEntity.notas1 = orderDto.notas1;
        orderEntity.notas2 = orderDto.notas2;
        orderEntity.contenido = orderDto.contenido;
        orderEntity.cuenta = orderDto.cuenta;
        orderEntity.centroDeCostos = orderDto.centroDeCostos;
        orderEntity.fechaImagen = orderDto.fechaImagen;
        orderEntity.imagenGuia = orderDto.imagenGuia;
        orderEntity.novedadesPorGuia = orderDto.novedadesPorGuia;
        orderEntity.fechaNovedades = orderDto.fechaNovedades;
        orderEntity.updatedOrder = false; 
        return orderEntity;
    }


}
