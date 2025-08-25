import "reflect-metadata"
import { injectable } from "tsyringe"
import { Equal } from "typeorm"
import { Template } from "../../domain/entities/template.entity.js"
import { ITemplateRepository } from "../../domain/repository/ITemplateRepository.js"
import { dataSource } from "../config/datasource.js"
import { CrudRepository } from "./crud.repository.js"

@injectable()
export class TemplateRepository
  extends CrudRepository<Template | any>
  implements ITemplateRepository {

  async saveTemplate(data_template: Template): Promise<any> {

    try {

      return await dataSource.manager.save<any>(data_template)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getAllTemplate(): Promise<Template[]> {
    try {
      return await dataSource.manager.find<any>(Template)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getTemplateById(id:string): Promise<Template[] | null> {
    const template_response = await dataSource.manager.findOne(Template,{where: { id }});
    return template_response;
  }
  async templateExist(name: string): Promise<Boolean> {
    try {
      return await dataSource.manager.exists<any>(Template, {
        templatename: Equal(name)
      })
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async templateExistById(id: string): Promise<Boolean> {
    try {
      return await dataSource.manager.exists<any>(Template, {
        id: Equal(id)
      })
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async deleteTemplateById(id:string): Promise<any> {
    const template = this.templateExistById(id)
    await dataSource.manage.remove(template);
  }
}