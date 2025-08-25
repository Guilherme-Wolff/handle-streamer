import "reflect-metadata"
import { container, injectable } from "tsyringe"
import { DeleteResult, Equal } from "typeorm"
import { v4 as uuid4 } from "uuid"

import { Template } from "../../domain/entities/template.entity.js"
import { TemplateRepository } from "../RepositoryImpl/template.repository.js"

interface TemplateRegister {
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
  //private chargePointRepository: UsersRepository = container.resolve(UsersRepository)
  private TemplateRepository: TemplateRepository = container.resolve(TemplateRepository)

  public getAllTemplate = async (): Promise<Template[]> => {
    try {
      //return await this.UsersRepository.find(EntityType, { select: { id: true, identity: true, cpo: true } })
      return await this.TemplateRepository.getAllTemplate()
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  public getTemplateById = async (id: string): Promise<Template[]> => {
    try {
      return await this.TemplateRepository.getTemplateById(id)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  public saveTemplate = async (template: TemplateRegister): Promise<Template[]> => {
    try {
      const templateExist = await this.TemplateRepository.templateExist(template.name)


      if (!templateExist) {
        throw new Error('E-mail already exists.');
      }
      else {
        return await this.TemplateRepository.saveTemplate(template)
      }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

}