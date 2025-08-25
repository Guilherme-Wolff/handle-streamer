import "reflect-metadata"
import { ICrudRepository } from "../../domain/repository/ICrudRepository.js"
import { DeleteResult, EntityTarget, FindManyOptions, ObjectLiteral } from "typeorm"
import { dataSource } from "../config/datasource.js"

/**
 * General implementation of the ICrudRepository interface
 */

export class CrudRepository<T extends ObjectLiteral> implements ICrudRepository<T> {

  async find(Entity: T, options?: FindManyOptions<T>): Promise<typeof Entity[]> {
    try {
      return await dataSource.manager.find<T>((Entity as any as EntityTarget<T>), options)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async findById(Entity: T, id: string): Promise<typeof Entity | null> {
    try {
      return await dataSource.manager.findOneBy<any>((Entity as any as EntityTarget<T>), { id: id })
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  /*async save(Entity: T): Promise<T> {
    try {
      return await dataSource.manager.save<T, T>((Entity as any as EntityTarget<T>), Entity, { data: Entity.name})
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/

 /* async deleteById(Entity: T, id: string): Promise<DeleteResult> {
    try {
      return await dataSource.manager.delete<DeleteResult>((Entity as any as EntityTarget<DeleteResult>), id)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/

  /*async remove(Entities: T[], Entity: T): Promise<T[]> {
    try {
      return await dataSource.manager.remove<T[]>((Entity as any as EntityTarget<T[]>), Entities)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/
}