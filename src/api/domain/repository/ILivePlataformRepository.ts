import { Streamers } from "../entities/streamers.entity"

/**
 * Chargepoint interface holding a set of specific operations
 */
export interface ILivePlataformRepository {
  isStreamerExist(name: string): Promise<boolean>
  addStreamer(name: string,plataform: string): Promise<Streamers[] | boolean>
  //userExist(email: string): Promise<Boolean>
}