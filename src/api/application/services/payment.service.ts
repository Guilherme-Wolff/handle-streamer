import "reflect-metadata"
import { container, injectable } from "tsyringe"
import { DeleteResult, Equal } from "typeorm"
import { v4 as uuid4 } from "uuid"
import { Users } from "../../domain/entities/users.entity.js"
import { UsersRepository } from "../RepositoryImpl/users.repository.js"
import { EntityType } from "../../infrastructure/utils/entity-types.js"

interface UserRegister {
  name: string;
  email: string;
  password: string;
}
/**
 * Implementation of the Chargepoint bussiness logic layer.
 * 
 * Service is made available as an injectable for DI container specified in bootstrap class app.ts.
 */
@injectable()
export class UsersService {

  // Dependency Injection
  private UsersRepository: UsersRepository = container.resolve(UsersRepository)

  public getAllUsers = async (): Promise<Users[]> => {
    try {
      //return await this.UsersRepository.find(EntityType, { select: { id: true, identity: true, cpo: true } })
      return await this.UsersRepository.getAllUsers()
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  public addUser = async (user: UserRegister): Promise<Users[]> => {
    try {
      const isEmailUnique = await this.UsersRepository.isEmailUnique(user.email)
      const isNameUnique = await this.UsersRepository.isNameUnique(user.name)

      if (!isEmailUnique) {
        throw new Error('E-mail already exists.');
      } else if (!isNameUnique) {
        throw new Error('Name already exists.');
      }
      else {
        return await this.UsersRepository.addUser(user)
      }

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }
}