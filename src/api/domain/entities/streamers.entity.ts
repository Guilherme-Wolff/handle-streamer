import {
  BeforeInsert,
  BeforeUpdate,
  Column, CreateDateColumn, Entity,
  JoinColumn, ManyToMany, OneToMany, OneToOne,
  PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import { Users } from "./users.entity.js";
import { UserStreamerFollow } from "./user_stramer_follows.entity.js";


@Entity()
export class Streamers {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: false, nullable: false })
  name: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true, default: false })
  online: boolean;

  @Column({ nullable: true, default: false })
  activated: boolean;

  @Column({ nullable: true })
  album_id: string;
  
  @Column()
  platform: string;

  @Column({ nullable: true, default: false })
  baned: boolean;

  @Column({ nullable: true })
  mainurlm3u8: string;

  @Column({ nullable: true })
  curr_title: string;

  @OneToMany(() => UserStreamerFollow, (follow) => follow.streamer)
  followers_relation: UserStreamerFollow[];

  @Column({ nullable: true, default: 0 })
  number_followers: number;

  @Column({ nullable: true, default: false })
  is_saving: boolean; 

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  constructor(
    _name: string,
    _platform: string,
    _avatar: string = "",
    _country:string = ""
  ) {
    this.name = _name;
    this.platform = _platform;
    this.avatar = _avatar;
    this.country = _country;
  }
  
  /*@BeforeInsert()
  //@BeforeUpdate()
  /*async updateNumberFollowers() {
    this.number_followers =  this.followers ? this.followers.length : 0;
  }*/
}