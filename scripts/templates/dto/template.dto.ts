import { IsString, IsNotEmpty, IsUUID, IsArray } from 'class-validator'

export interface TemplateDTO {
  id?: string;
  templatename?: string;
}

