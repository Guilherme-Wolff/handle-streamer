import { UpdateResult } from "typeorm"
import { Streamers } from "../entities/streamers.entity"

/**
 * Chargepoint interface holding a set of specific operations
 */
export interface ITwitchRepository {
  isStreamerExist(name: string): Promise<boolean>
  saveMainUrl(streamer: string, main_url: string, platform: string): Promise<UpdateResult>
  addStreamer(name: string,platform:string): Promise<any>
  //userExist(email: string): Promise<Boolean>
}