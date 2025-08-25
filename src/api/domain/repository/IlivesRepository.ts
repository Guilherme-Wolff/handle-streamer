import { Lives } from "../entities/lives.entity"

export interface ILivesRepository {
  saveLivesAndGetId(live: Lives): Promise<any>
  saveLives(live: Lives): Promise<any>
  getAllLives(): Promise<Lives[]>
  getStreamerLives(name: string, platform: string): Promise<Lives[]> 
  //livesExist(): Promise<boolean>
  //livesExistById(id:string): Promise<boolean>
  //findLivesById(id: string): Promise<Lives[] | null>
  // deleteLivesById(id: string): Promise<any>
}