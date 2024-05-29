export class CreateOrderDto{
    pedido: number 
    guia: string
    Cc: string
    nombresDestinatario: string 
    direccionEntrega: string
    direccionRemitente: string
    departamento: string
    ciudadDestino: string
    telefono: number
    tipoProducto: string
    fechaProd: Date
    fechaEntrega: Date
    estadosLogistico: string
    novedades: string
    descripcionNovedad: string
    fechaNovedad: Date
    ultimoMensajeroEnReparto: string
    notas1: string
    notas2: string
    contenido: string
    cuenta: string
    centroDeCostos: string
    fechaImagen: Date
    imagenGuia: Buffer
    novedadesPorGuia: number 
    fechaNovedades: Date
}