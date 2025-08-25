import { Template } from "../entities/template.entity"

export interface ITemplateRepository {
  saveTemplate(id: string): Promise<any>
  getAllTemplate(): Promise<Template[]>
  templateExist(): Promise<boolean>
  templateExistById(): Promise<boolean>
  findTemplateById(id: string): Promise<Template[] | null>
  deleteTemplateById(id: string): Promise<any>
}