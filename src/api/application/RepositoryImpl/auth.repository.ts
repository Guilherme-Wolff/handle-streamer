import "reflect-metadata"
import { injectable } from "tsyringe"
import { Equal } from "typeorm"
import { Users } from "../../domain/entities/users.entity.js"
import { IAuthRepository } from "../../domain/repository/IAuthRepository.js"
import { dataSource } from "../config/datasource.js"
import { CrudRepository } from "./crud.repository.js"

interface UserRegister {
  name: string;
  email: string;
  password: string;
}


@injectable()
export class AuthRepository
  extends CrudRepository<Users | any>
  implements IAuthRepository {
  async findById(id: string): Promise<Users[]> {
    try {
      return await dataSource.manager.findOne<any>(Users,
        {
          select: { name: true, role: true },
          where: { id: Equal(id) }
        }
      )
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async addUser(user: UserRegister): Promise<any> {

    try {

      return await dataSource.manager.save<any>(Users,user)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getAllUsers(): Promise<Users[]> {
    try {
      return await dataSource.manager.find<any>(Users)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async isEmailUnique(email: string): Promise<boolean> {
    const existingUser = await dataSource.manager.findOne<any>(Users, { where: { email } })
    return !existingUser;
  }

  async isNameUnique(name: string): Promise<boolean> {
    const existingUser = await dataSource.manager.findOne<any>(Users, { where: { name } })
    return !existingUser;
  }

  async validLogin(email: string,password:string): Promise<boolean> {
    const existingUser = await dataSource.manager.findOne<any>(Users, { where: { email,password } })
    return !existingUser;
  }

  async getPasswordByEmail(email:string): Promise<Users | any> {
    //const user = await dataSource.manager.findOne<any>(Users, {email})
    return await dataSource.manager.findOne(Users,{where: { email }});
 
  }
  /*async userExist(email: string): Promise<Boolean> {
    try {
      return await dataSource.manager.exists<any>(Users, {
        email: Equal(email)
      })
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/
}