import {
  Column, CreateDateColumn, Entity,
  PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";

@Entity()
export class Lives {
  @PrimaryGeneratedColumn("uuid")
  id: string;

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

  /* @Column('simple-array', { nullable: true })
   urls: string[];*/
  @Column({ nullable: true })
  urls: string;

  @Column({ nullable: true })
  views: number = 0;

  @Column({ nullable: true })
  duration: number = 0;

  @Column({ nullable: true })
  chat: string;

  @Column('simple-array', { nullable: true })
  likedUserIds: string[];

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: 0 })  // Adiciona uma coluna para contar os likes, começando com 0 por padrão
  likes: number;

  constructor(
    _streamer_id: string,
    _streamer: string,
    _platform: string,
    _tittle: string,
    _tags:string[]=[''],
    _country:string=''
    // _thumbnail: string,
    //_urls: string[],
    //_likes: number = 0  // Inicializa os likes (opcional, para garantir que seja fornecido ou padrão para 0)
  ) {
    this.streamer_id = _streamer_id;
    this.streamer = _streamer;
    this.platform = _platform;
    this.tittle = _tittle;
    this.tags = _tags;
    this.country = _country;
    //this.thumbnail = _thumbnail;
    //this.urls = _urls;
    //this.likes = _likes;
  }

  // Método para adicionar um like
  addUrlLive(url: string) {
    this.urls = url;

  }

  addLike(userId: string) {
    if (!this.likedUserIds.includes(userId)) {
      this.likes += 1;
      this.likedUserIds.push(userId);
    }
  }
  unlike(userId: string) {
    const index = this.likedUserIds.indexOf(userId);
    if (index > -1) {
      this.likes -= 1;
      this.likedUserIds.splice(index, 1);
    }
  }
  /*unlike(userId: string) {
    if (this.likedUserIds.includes(userId)) {
      this.likes -= 1;
      this.likedUserIds = this.likedUserIds.filter(id => id !== userId);
    }
  } */

  incrementViews() {
    this.views += 1;
  }
}
