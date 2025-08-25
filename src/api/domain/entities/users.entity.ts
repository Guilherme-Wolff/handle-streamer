import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

//import { Streamers } from "./streamers.entity.js"
import { UserStreamerFollow } from "./user_stramer_follows.entity.js";

@Entity()
export class Users {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: false })
  name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false, default: false })
  premium: boolean;

  @Column({ nullable: true, default: false }) // Pode ser null até que o código seja gerado
  confirmed: boolean;

  @Column({ nullable: true, default: 0 }) // Pode ser null até que o código seja gerado
  views_free: number;

  @Column({ type: "timestamp", nullable: true })
  block_free_date: Date | null;
  //stripe
  @Column({ nullable: true })
  stripe_customer_id: string;

  @Column({ nullable: true })
  stripe_subscription_id: string;

  @Column({ nullable: true })
  stripe_subscription_status: string;

  @Column({ nullable: true })
  stripe_price_id: string;

  /*@ManyToMany(() => Streamers, streamer => streamer.followers)
  @JoinTable({
    name: "user_streamers", // Nome da tabela intermediária
    joinColumn: {
      name: "user_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "streamer_id",
      referencedColumnName: "id"
    }
  })*/
  @OneToMany(() => UserStreamerFollow, (follow) => follow.user)
  follows: UserStreamerFollow[];
  //following: string[];

  favorites: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /*@OneToOne(() => Customer)
  @JoinColumn()
  customer: Customer;*/

}
