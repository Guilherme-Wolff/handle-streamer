
import {
    Column, CreateDateColumn, Entity,
    Index,
    JoinColumn, ManyToOne,
    PrimaryColumn,
} from "typeorm";
import { Users } from "./users.entity.js";
import { Streamers } from "./streamers.entity.js"

@Entity('user_streamer_follows')
@Index('idx_user_id', ['user_id'])
@Index('idx_streamer_id', ['streamer_id']) 
@Index('idx_user_streamer_composite', ['user_id', 'streamer_id'])
@Index('idx_created_at', ['created_at'])
export class UserStreamerFollow {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn('uuid')
  streamer_id: string;

  @CreateDateColumn()
  created_at: Date;

  // Opcional: adicionar campos extras
  @Column({ nullable: true })
  notification_enabled: boolean;

  @Column({ nullable: true, type: 'enum', enum: ['follow', 'subscribe', 'vip'] })
  follow_type: string;

  /*@ManyToOne(() => Streamers, (streamer) => streamer.followers_relation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamer_id' })
  streamer: Streamers;

  @ManyToOne(() => Users, (user) => user.follows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;*/
  @ManyToOne('Users', 'follows', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any; // ou import type { Users } from './Users' e manter Users

  @ManyToOne('Streamers', 'followers_relation', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamer_id' })
  streamer: any;

 
}


/*@Entity('user_streamer_follows')
@Index('idx_user_id', ['user_id']) // Índice nomeado
@Index('idx_streamer_id', ['streamer_id']) // Índice nomeado
@Index('idx_user_streamer_composite', ['user_id', 'streamer_id']) // Índice composto nomeado
@Index('idx_created_at', ['created_at']) // Índice para ordenação por data
export class UserStreamerFollow {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn('uuid')
  streamer_id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Streamers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamer_id' })
  streamer: Streamers;
}*/