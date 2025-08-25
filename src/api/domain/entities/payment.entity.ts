import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({type:'text'})
  cardNumber: string;

  @Column({type:'text',nullable:true})
  description: string;

  @Column()
  amount: number;

  @Column({type:'text'})
  currency: string;

  @Column()
  expirationDate: string;

  // Outros campos relevantes

  constructor(amount: number, cardNumber: string,currency:string,expirationDate: string) {
    this.amount = amount;
    this.cardNumber = cardNumber;
    this.currency = currency;
    this.expirationDate = expirationDate;
  }
}

