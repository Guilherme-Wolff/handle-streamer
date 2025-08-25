import { IsString, IsNotEmpty, IsUUID, IsArray } from 'class-validator'

export interface LiveDTO {
  streamr: string
  cpo: string
}

export class AddLive implements LiveDTO {
  @IsString()
  @IsNotEmpty()
  streamr: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  cpo: string
}
