import { IsString, IsNotEmpty, IsUUID, IsArray } from 'class-validator'

/**
 * DTO specification for the Organization resource.
 * 
 * Used in combination with the /helpers/chargepoint-dtovalidation class to validate input data from request.
 * 
 * Each class represents a subset type of the interface OrganizationModel, its used on a specific route.
 */
export interface OrganizationModel {
  id: string
  name: string
  legalEntity?: string
  chargePoints?: []
  entityType?: string
}

export class UpsertOrganizationDTO implements Pick<OrganizationModel, "name" | "legalEntity"> {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  legalEntity?: string
}

export class FindByNameDTO implements Pick<OrganizationModel, "name" | "entityType"> {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  entityType: string
}

export class FindOneOrganizationDTO implements Pick<OrganizationModel, "id" | "entityType"> {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string

  @IsString()
  @IsNotEmpty()
  entityType: string
}

export class FindAllOrganizationsDTO implements Pick<OrganizationModel, "entityType"> {
  @IsString()
  @IsNotEmpty()
  entityType: string
}

export class DeleteOrganizationByIdDTO implements Pick<OrganizationModel, "id" | "name" | "legalEntity"> {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  legalEntity?: string
}

export class RemoveOrganizationsDTO {
  @IsArray()
  @IsNotEmpty()
  entities: OrganizationModel[]
}