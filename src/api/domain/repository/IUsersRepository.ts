import { Users } from "../entities/users.entity"

/**
 * Chargepoint interface holding a set of specific operations
 */
export interface IUsersRepository {
  findById(id: string): Promise<Users[]>
  getAllUsers(): Promise<Users[]>
  //userExist(email: string): Promise<Boolean>
}