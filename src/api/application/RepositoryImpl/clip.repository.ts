import "reflect-metadata"
import { injectable } from "tsyringe"
import { DeleteResult, Equal, IsNull, UpdateResult } from "typeorm"
import { Lives } from "../../domain/entities/lives.entity.js"
import { IClipRepository } from "../../domain/repository/IClipRepository.js"
import { dataSource } from "../config/datasource.js"
import { CrudRepository } from "./crud.repository.js"
import { Streamers } from "../../domain/entities/streamers.entity.js"
import { Clip } from "../../domain/entities/clip.entity.js"

@injectable()
export class ClipRepository
  extends CrudRepository<Lives | any>
  implements IClipRepository {

  async saveClipAndGetId(live: Clip): Promise<any> {

    try {

      //verificar com redis se nao esta sendo salva ,pois esta repitindo o CREATE

      const _live = await dataSource.manager.save<Clip>(Clip,live)

      return _live.id
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async saveClip(clip: Clip): Promise<string> {
    try {
      const _clip_ = await dataSource.manager.save<Clip>(Clip,clip)
      if (_clip_) {
        return _clip_[0].id
      } else {
        return ''
      }
    } catch (error) {
      console.error(`error save live`)
      throw new Error((error as Error).message)
    }
  }

  async getDataForClip(id: string): Promise<Lives> {

    const live =  await dataSource.manager.find<Lives>(Lives, {
      where: {
        id
      },
      select: ["id", "streamer_id","tittle","streamer","country","platform","tags","urls"]
    })

    return live[0];
  }

  async isStreamExist(streamer: string, platform: string): Promise<boolean> {
    const existing = await dataSource.manager.findOne<Lives>(Lives, { where: { streamer, platform } })
    return !!existing;
  }

  async getCurrentLive(streamer: string, platform: string): Promise<Lives | null> {
    // return await dataSource.manager.findOne<Lives>(Lives, { where: { streamer, platform } })

    const live = await dataSource.manager.findOne<Lives>(Lives, {
      where: { streamer, platform },
      //select: ["urls"],
      order: { created_at: 'DESC' } // Supondo que você tenha uma coluna createdAt
    });

    return live || null;
  }

  async getCurrentLiveThumb(streamer: string, platform: string): Promise<Lives | null> {
    // return await dataSource.manager.findOne<Lives>(Lives, { where: { streamer, platform } })

    const live = await dataSource.manager.findOne<Lives>(Lives, {
      where: { streamer, platform },
      select: ["thumbnail"],
      order: { created_at: 'DESC' } // Supondo que você tenha uma coluna createdAt
    });

    return live || null;
  }


  //FUNÇAO DEVE ESTAR O EXECUTOR
  async getStreamerClips(name: string, platform: string): Promise<Clip[]> {
    const streamer = await dataSource.manager.find<Streamers>(Streamers, {
      where: {
        name, platform
      },
      select: ["id"]
    });

    console.log("streamer online:", streamer[0].online)

    if (streamer[0] /*&& streamer[0].online === false*/) {
      //const livs_all = await dataSource.manager.find<Lives>(Lives);

      const livs = await dataSource.manager.find<Clip>(Clip, {
        where: {
          streamer_id: streamer[0].id,
        },
      });

      return livs;
    }
    return []
    //get posts
  }

  async updateStreamUrls(id: string, newUrls: string): Promise<UpdateResult[]> {
    try {
      console.log(`
        ================================================
        UPDATE STREAM URLS
        ================================================
        ID: ${id}
        NEW URLS: ${newUrls}
        ================================================
        `)
      return await dataSource.manager.update(Clip, { id }, { urls: newUrls });

      //return await dataSource.manager.save<any>(Streamers)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async updateChat(id: string, chat_url: string): Promise<any> {
    try {
      /*return await dataSource.manager.update<any>('mainurlm3u8',Streamers,
        {
          update: { mainurlm3u8: main_url },
          where: { name: Equal(streamer),platform:Equal(platform) }
        }
      )*/
      return await dataSource.manager.update(Lives, { id }, { chat: chat_url });

      //return await dataSource.manager.save<any>(Streamers)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async updateThumbnail(id: string, thumb_url: string): Promise<any> {
    try {
      /*return await dataSource.manager.update<any>('mainurlm3u8',Streamers,
        {
          update: { mainurlm3u8: main_url },
          where: { name: Equal(streamer),platform:Equal(platform) }
        }
      )*/
      return await dataSource.manager.update(Lives, { id }, { thumbnail: thumb_url });

      //return await dataSource.manager.save<any>(Streamers)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getStreamById(id: string): Promise<Lives | null> {
    const stream = await dataSource.manager.findOne<Lives>(Lives, { where: { id } })
    return stream;
  }

  async deleteLivesWithoutUrl(streamers: string[]): Promise<DeleteResult> {
    try {
      const del = await dataSource.manager.createQueryBuilder()
        .delete()
        .from(Lives)
        .where("(urls IS NULL OR urls = '') AND streamer IN (:...streamers)", { streamers })
        .execute();
  
      return del;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  /*async getLivesById(id: string): Promise<Lives[] | null> {
    const lives_response = await dataSource.manager.findOne(Lives, { where: { id } });
    return [lives_response];
  }*/


  /*async livesExistById(_id: string): Promise<boolean> {
     try {
       return await dataSource.manager.exists<any>(Lives, {
         id: Equal(_id)
       })
     } catch (error) {
       throw new Error((error as Error).message)
     }
   }
 
   async deleteLivesById(id: string): Promise<any> {
     const lives = this.livesExistById(id)
     await dataSource.manage.remove(lives);
   }*/
}