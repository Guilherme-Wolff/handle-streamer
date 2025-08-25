import { Users } from "../entities/users.entity"

/**
 * Chargepoint interface holding a set of specific operations
 */
export interface IAuthRepository {
  findById(id: string): Promise<Users[]>
  getAllUsers(): Promise<Users[]>
  isEmailUnique(email: string): Promise<boolean>
  isNameUnique(name: string): Promise<boolean>
  getPasswordByEmail(email:string): Promise<Users>
}