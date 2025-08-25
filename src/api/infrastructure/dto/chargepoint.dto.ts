import { IsString, IsNotEmpty, IsUUID, IsArray } from 'class-validator'

export interface ChargepointModel {
  id: string
  identity: string
  cpo: string
  entityType?: string
}

export class UpsertChargePointDTO implements Pick<ChargepointModel, "identity" | "cpo"> {
  @IsString()
  @IsNotEmpty()
  identity: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  cpo: string
}

export class FindByIdentityDTO implements Pick<ChargepointModel, "identity"> {
  @IsString()
  @IsNotEmpty()
  identity: string
}

export class FindByCpoDTO implements Pick<ChargepointModel, "cpo"> {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  cpo: string
}

export class FindOneChargepointDTO implements Pick<ChargepointModel, "id" | "entityType"> {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string

  @IsString()
  @IsNotEmpty()
  entityType: string
}

export class FindAllChargepointsDTO implements Pick<ChargepointModel, "entityType"> {

  @IsString()
  @IsNotEmpty()
  entityType: string
}

export class DeleteChargepointByIdDTO implements Pick<ChargepointModel, "id" | "identity"> {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string

  @IsString()
  @IsNotEmpty()
  identity: string
}

export class RemoveChargepointsDTO {
  @IsArray()
  @IsNotEmpty()
  entities: ChargepointModel[]
}