import { Clip } from "../entities/clip.entity"

export interface IClipRepository {
  saveClipAndGetId(live: Clip): Promise<any>
  saveClip(live: Clip): Promise<any>

  getStreamerClips(name: string, platform: string): Promise<Clip[]> 
  //livesExist(): Promise<boolean>
  //livesExistById(id:string): Promise<boolean>
  //findLivesById(id: string): Promise<Lives[] | null>
  // deleteLivesById(id: string): Promise<any>
}