import {
  Column, CreateDateColumn, Entity,
  PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import { Lives } from "./lives.entity.js";

@Entity()
export class Clip {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  live_id: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  streamer_id: string;

  @Column({ nullable: false })
  streamer: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  tittle: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column()
  platform: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  urls: string;

  @Column({ nullable: true, default: 0 })
  views: number;

  @CreateDateColumn()
  created_at: Date;

  constructor(/*live:Lives,userId:string*/) {
    /*this.userId = userId,
    this.live_id = live.id
    this.streamer_id = live.streamer_id
    this.streamer = live.streamer
    this.country = live.country
    this.tittle = live.tittle
    this.platform = live.platform
    this.tags = live.tags*/
  }
}
