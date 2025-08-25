import { DeleteResult, FindManyOptions } from "typeorm"

/**
 * Interface holding a set of Basic CRUD operations
 */
export interface ICrudRepository<T> {
  find(Entity: T, options: FindManyOptions<T>): Promise<T[]>
  findById(Entity: T, id: string): Promise<T | null>
  //save(Entity: T): Promise<T> // saves if not exists, updates if exists
  //deleteById(Entity: T, id: string): Promise<DeleteResult>
  //remove(Entities: T[], Entity: T): Promise<T[]>
}