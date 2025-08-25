//import "reflect-metadata"
import { container, injectable } from "tsyringe"
import { DeleteResult, Equal, UpdateResult } from "typeorm"
import { v4 as uuid4 } from "uuid"

import { Lives } from "../../domain/entities/lives.entity.js"
import { LivesRepository } from "../RepositoryImpl/lives.repository.js"
import { StreamersService } from "./streamers.service.js"
import { platform } from "os"

interface ISaveLive {
  streamer: string;
  platform: string;
  tittle?: string;
  tags?: string[];
  country: string;
}


@injectable()
export class LiveService {

  // Dependency Injection
  //private chargePointRepository: UsersRepository = container.resolve(UsersRepository)
  private LivesRepository: LivesRepository = container.resolve(LivesRepository)
  private StreamersService: StreamersService = container.resolve(StreamersService)

  public saveLives = async (livesInfo: ISaveLive): Promise<string> => {
    try {
      //const livesExist = await this.LivesRepository.livesExist(lives)
      const streamer_id = await this.StreamersService.getStreamerId(livesInfo.streamer, livesInfo.platform)

      //console.log("ID DO STREAMER: ", streamer_id)

      let live = await new Lives(streamer_id, livesInfo.streamer, livesInfo.platform, 
                                 String(livesInfo.tittle), livesInfo.tags ? [String(livesInfo.tags)] : [''], 
                                 String(livesInfo.country));

      

      return await this.LivesRepository.saveLives(live)

    } catch (error) {
      console.log(`
     ERRO IN FUNCTION saveLives
     ERRO IN FUNCTION saveLives
     ERRO IN FUNCTION saveLives
     ERRO IN FUNCTION saveLives
        `)
      throw new Error((error as Error).message)
    }
  }


  public getAllLives = async (): Promise<Lives[]> => {
    try {
      //return await this.UsersRepository.find(EntityType, { select: { id: true, identity: true, cpo: true } })
      return await this.LivesRepository.getAllLives()
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getStreamerLives(name: string, platform: string): Promise<Lives[]> {
    const lives = await this.LivesRepository.getStreamerLives(name, platform)
    if (lives) {
      return lives;
    }
    return []
    //get posts
  }

  async updateStreamUrls(URLS: string, live_id: string): Promise<UpdateResult | undefined> {
    console.log("UPDATRE STREAM COM URL:", URLS)

    const updateStream = await this.LivesRepository.updateStreamUrls(live_id, URLS);

    console.log("update stream", updateStream)

    if (updateStream) {
      return
    }

  }
  async updateThumbnailUrlAndDuration(live_id: string, thumb_url: string,duration:number): Promise<any> {
    //const streamRepository = this.StreamRepository.getUrl(name,plataform)

    console.log("ADICIONANDO THUMNAIL")
    console.log(`
      live_id :${live_id}
      `)
    await this.LivesRepository.updateThumbnailAndDuration(live_id, thumb_url,duration);

    return;

  }


  async updateThumbnailUrl(live_id: string, thumb_url: string): Promise<any> {
    //const streamRepository = this.StreamRepository.getUrl(name,plataform)

    console.log("ADICIONANDO THUMNAIL")
    console.log(`
      live_id :${live_id}
      `)
    await this.LivesRepository.updateThumbnail(live_id, thumb_url);

    return;

  }

  async updateThumbnailUrlClip(live_id: string, thumb_url: string): Promise<any> {
    //const streamRepository = this.StreamRepository.getUrl(name,plataform)
    await this.LivesRepository.updateThumbnailClip(live_id, thumb_url);

    return;

  }


  async updateChat(live_id: string, thumb_url: string): Promise<any> {
    console.log("UPDATRE STREAM COM URL:", thumb_url)
    //const streamRepository = this.StreamRepository.getUrl(name,plataform)

    console.log("ADICIONANDO THUMNAIL")
    await this.LivesRepository.updateChat(live_id, thumb_url);

    return;

  }

  async updateThumbnail(/*streamId: string, */thumb_url: string, streamer: string, platform: string,): Promise<UpdateResult | undefined> {
    console.log("UPDATRE STREAM COM URL:", thumb_url)
    //const streamRepository = this.StreamRepository.getUrl(name,plataform)

    const curre_live = await this.LivesRepository.getCurrentLiveThumb(streamer, platform);
    if (!curre_live) {
      console.error('Stream não encontrada');
      return undefined;
    }

    let thumb: string = curre_live.thumbnail
    if (!thumb) {
      console.log("ADICIONANDO THUMNAIL")
      const updateStream = await this.LivesRepository.updateThumbnail(curre_live.id, thumb);



      console.log("update stream", updateStream)
    }
  }

  async deleteLivesWithoutUrl(streamers: { streamer: string; platform: string }[]) {
    const res = this.LivesRepository.deleteLivesWithoutUrl(streamers)
    return res;
  }

  /*public getLivesById = async (id: string): Promise<Lives[]> => {
    try {
      return await this.LivesRepository.getLivesById(id)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/

  /*public livesExistById = async (id: string): Promise<boolean> => {
    try {
      //const livesExist = await this.LivesRepository.livesExist(lives)
      return await this.LivesRepository.livesExistById(id)

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/

}