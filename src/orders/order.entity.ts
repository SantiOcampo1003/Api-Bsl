import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm";

@Entity({name : 'orders'})
export class Order{
    @PrimaryGeneratedColumn()
    id: string;
  
    @Column() 
    pedido: number;
  
    @PrimaryColumn({unique: true}) 
    guia: string;
  
    @Column()
    Cc: string; 
  
    @Column()
    nombresDestinatario: string; 
  
    @Column()
    direccionEntrega: string;
  
    @Column()
    direccionRemitente: string;
  
    @Column()
    departamento: string;
  
    @Column()
    ciudadDestino: string;
  
    @Column()
    telefono: number;
  
    @Column()
    tipoProducto: string;
  
    @Column({ type: "datetime" })  
    fechaProd: Date;
  
    @Column({ type: "datetime" })  
    fechaEntrega: Date;
  
    @Column( {})
    estadosLogistico: string;
  
    @Column()
    novedades: string;
  
    @Column()
    descripcionNovedad: string;
  
    @Column({ type: "datetime" })  
    fechaNovedad: Date;
  
    @Column()
    ultimoMensajeroEnReparto: string;
  
    @Column()
    notas1: string;
  
    @Column()
    notas2: string;
  
    @Column()
    contenido: string;
  
    @Column()
    cuenta: string;
  
    @Column()
    centroDeCostos: string;
  
    @Column({ type: "datetime" }) 
    fechaImagen: Date;
  
    @Column({ type: "mediumblob" }) 
    imagenGuia: Buffer;
  
    @Column()
    novedadesPorGuia: number;
  
    @Column({ type: "datetime" })  
    fechaNovedades: Date;
  
    @Column({ default: false })  
    updatedOrder: boolean;

    @Column({default: false})
    synchronized: boolean;
}

