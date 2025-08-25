import "reflect-metadata"
import { container, injectable } from "tsyringe"
import { Streamers } from "../../domain/entities/streamers.entity.js"
import { StreamersRepository } from "../RepositoryImpl/streamers.repository.js"
import { Pixeldrain, ICreateAlbum } from "./pixeldrain.service.js"
import { FileUtilities } from "../../infrastructure/utils/utils_files.js"
import { EntityMetadataNotFoundError } from "typeorm"
import { Process } from "../../infrastructure/processManager/interfaces.js"


interface streamerExist {
  exist: boolean;
  url: string;
}

interface IaddStreamer {
  sucess: boolean
}


@injectable()
export class StreamersService {
  constructor() { }

  private StreamersRepository: StreamersRepository = container.resolve(StreamersRepository)

  private FileUtilities: FileUtilities = new FileUtilities;

  async getCountry(streamer: string, platform: string) {
    return await this.StreamersRepository.getCountry(streamer, platform)
  }

  async streamerExistInTiktok(name: string, plataform: string = 'tiktok'): Promise<streamerExist> {
    let resp: streamerExist = {
      exist: false,
      url: ''
    }

    try {
      //const exist = this.FileUtilities.streamerExistInTiktok(name)
      //const streamer: Streamers = new Streamers(name, plataform)
      //let streamerExist = await this.StreamersRepository.addStreamer(name, plataform)
      let streamerExist = await this.StreamersRepository.isStreamerExist_for_Update(name, plataform)
      if (!streamerExist) {
        console.log("NAO EXISTE :", streamerExist)
        let exist: streamerExist = await this.FileUtilities.streamerExistInTiktok(name)

        resp.exist = true
        resp.url = exist.url

        return await resp;

        //return await exist
      } else {

        return await resp;
      }

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }


  async addStreamer(name: string, plataform: string, avatar: string, country: string): Promise<IaddStreamer | any> {
    let resp: IaddStreamer = {
      sucess: false
    }

    try {

      let streamerExist = await this.StreamersRepository.isStreamerExist_for_update(name, plataform)

      if (!streamerExist) {
        const res = await this.StreamersRepository.addStreamer(name, plataform, avatar, country)
      } else {

      }

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getAllStreamersNameEAvatar(): Promise<Streamers[] | any> {

    try {

      let streamers = await this.StreamersRepository.getAllStreamersNameEAvatar()


      if (streamers) {
        return streamers;
      }

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getAllStreamersWithoutCountry(): Promise<Streamers[] | any> {

    try {

      let streamers = await this.StreamersRepository.getAllStreamers()


      if (streamers) {
        return streamers;
      }

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getStreamersWithoutSpecificCountries(): Promise<Streamers[] | any> {

    try {
      let streamers = await this.StreamersRepository.getStreamersWithoutSpecificCountries()
      if (streamers) {
        return streamers;
      }

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getAvatarInTiktok(name: string, plataform: string = 'tiktok'): Promise<streamerExist> {
    let resp: streamerExist = {
      exist: false,
      url: ''
    }

    try {


      let exist: streamerExist = await this.FileUtilities.streamerExistInTiktok(name)

      resp.exist = true
      resp.url = exist.url

      return await resp;

      //return await exist


    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async updateAvatarUrl(name: string, plataform: string, url: string): Promise<any> {

    try {
      //const streamer: Streamers = new Streamers(name, plataform)
      return await this.StreamersRepository.updateAvatarUrl(name, plataform, url)

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async updateCountry(name: string, plataform: string, country: string): Promise<any> {

    try {
      //const streamer: Streamers = new Streamers(name, plataform)
      return await this.StreamersRepository.updateCountry(name, plataform, country)

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  /*async updateAllAvatarStreamers(): Promise<any> {

    try {
      const streamers = await this.getAllStreamersNameEAvatar()
      console.log("STREAMERS SEM AVATAR",streamers)

      //const streamer: Streamers = new Streamers(name, plataform)

      //return await this.StreamersRepository.updateAvatarUrl(name, url, plataform)

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/

  async getStreamerId(name: string, plataform: string): Promise<string> {

    try {
      const id = await this.StreamersRepository.getStreamerId(name, plataform)

      if (id) {
        return id;
      } else {
        return ''
      }

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getUrl(name: string, plataform: string): Promise<any> {

    try {
      const streamer: Streamers = new Streamers(name, plataform)
      let streamerExist = await this.StreamersRepository.getUrl(name, plataform)

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async updateOffline(strm:Process[]): Promise<any> {

    try {
      return await this.StreamersRepository.updateOffline(strm)

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async updateOnline(strm:Process[]): Promise<any> {

    try {
      return await this.StreamersRepository.updateOnline(strm)

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }
  

  /*async updateMainUrl(name: string, url, plataform: string): Promise<any> {

    try {
      //const streamer: Streamers = new Streamers(name, plataform)
      return await this.StreamersRepository.updateMainUrl(name, url, plataform)

    } catch (error: any) {
      throw new Error((error as Error).message)
    }
  }*/
  async getStreamers(): Promise<Streamers[] | null> {
    try {
      return await this.StreamersRepository.getStreamers();
    } catch (error: any) {
      // Log the full error for debugging
      console.error("Error in getStreamersForSaving:", {
        message: error.message,
        stack: error.stack,
      });

      // Handle specific EntityMetadataNotFoundError
      if (error instanceof EntityMetadataNotFoundError) {
        throw new Error(
          "Falha ao acessar a entidade Streamers: Metadados não encontrados. Verifique a configuração do TypeORM."
        );
      }

      // Handle other errors
      throw new Error(
        `Erro ao buscar streamers: ${error.message || "Erro desconhecido"}`
      );
    }
  }

  async getMoreStreamers(last_streamer_id: string): Promise<Streamers[] | null> {
    try {
      return await this.StreamersRepository.getMoreStreamers(last_streamer_id);
    } catch (error: any) {
      // Log the full error for debugging
      console.error("Error in getStreamersForSaving:", {
        message: error.message,
        stack: error.stack,
      });

      // Handle specific EntityMetadataNotFoundError
      if (error instanceof EntityMetadataNotFoundError) {
        throw new Error(
          "Falha ao acessar a entidade Streamers: Metadados não encontrados. Verifique a configuração do TypeORM."
        );
      }

      // Handle other errors
      throw new Error(
        `Erro ao buscar streamers: ${error.message || "Erro desconhecido"}`
      );
    }
  }

  async getStreamersForBan() {
    try {
      return await this.StreamersRepository.getStreamersForBan();
    } catch (error: any) {
      throw new Error((error as Error).message)
    }
  }

  async returnStreamersToDatabase(streamers: { streamer: string; platform: string }[]) {
    try {
      return await this.StreamersRepository.returnStreamersToDatabase(streamers);
    } catch (error: any) {
      throw new Error((error as Error).message)
    }
  }

  async returnStreamersToDatabase2(streamers: string[]) {
    try {
      return await this.StreamersRepository.returnStreamersToDatabase2(streamers);
    } catch (error: any) {
      throw new Error((error as Error).message)
    }
  }

  async addBan(streamer: string, platform: string) {
    try {
      return await this.StreamersRepository.addBan(streamer, platform);
    } catch (error: any) {
      throw new Error((error as Error).message)
    }
  }

  async addAlbumID(streamer_name: string, file_id: string, plataform: string): Promise<any> {

    try {
      /* console.log(`
 
         == AD ALBUM  == AD ALBUM  == AD ALBUM  == AD ALBUM  == AD ALBUM  
        ${streamer_name}      ${file_id}           ${plataform}
         == AD ALBUM  == AD ALBUM  == AD ALBUM  == AD ALBUM  == AD ALBUM  
         
         `)*/
      //const streamer: Streamers = new Streamers(streamer_name, plataform)

      const streamer_album = await this.StreamersRepository.getAlbumStreamer(streamer_name, plataform)


      if (!streamer_album.length) {
        /* console.log(`
           ====================================
           O ALBUM NAO EXISTE
           ====================================
           
           `)*/
        const albumDataWithId: ICreateAlbum = {
          "title": streamer_name,//uuid
          "anonymous": false,
          "files": [
            {
              "id": file_id,//id do arquivo que quer cololarr no album
              "description": ""
            },
            /*{
                "id": "123abc",
                "description": "The week went by so quickly, here's a photo from the plane back"
            }*/
          ]
        };


        //const StreamerService: StreamersService = new StreamersService;
        const pixeldrain = new Pixeldrain();

        const album_id = await pixeldrain.createAlbum(albumDataWithId)




        return await this.StreamersRepository.addAlbumID(streamer_name, album_id, plataform)

      } else {
        /*console.log(`
          ====================================
          O ALBUM JÁ EXISTE
          ====================================
          `)*/

        //const StreamerService: StreamersService = new StreamersService;
        const pixeldrain = new Pixeldrain();
        // const files :any[]= await pixeldrain.getFilesList(streamer_album)

        return await pixeldrain.addFileInAlbum(file_id, streamer_album, streamer_name)



        //return await this.StreamersRepository.addAlbumID(streamer_name, streamer.album_id, plataform)
      }







    } catch (error) {
      throw new Error((error as Error).message)
    }
  }
}