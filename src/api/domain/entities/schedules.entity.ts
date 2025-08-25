import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Schedules {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  streamer: string;

  @Column({ type: 'timestamp' })
  scheduledTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  /*@OneToOne(() => Customer)
  @JoinColumn()
  customer: Customer;*/

}
