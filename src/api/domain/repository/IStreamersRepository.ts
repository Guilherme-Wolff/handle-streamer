import { UpdateResult } from "typeorm"
import { Streamers } from "../entities/streamers.entity"

/**
 * Chargepoint interface holding a set of specific operations
 */
export interface IStreamersRepository {
  isStreamerExist(name: string): Promise<boolean>
  updateMainUrl(name: string, main_url: string, platform: string): Promise<UpdateResult>
  addStreamer(name: string,platform:string,avatar:string,country:string): Promise<any>
  getUrl(name: string,plataform: string): Promise<any>
  //userExist(email: string): Promise<Boolean>
}