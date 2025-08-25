import "reflect-metadata"
import { validate } from "class-validator"
import ExceptionHandler from "../exceptions/exceptions-handler.js"
import {
  DeleteChargepointByIdDTO,
  FindAllChargepointsDTO,
  FindByCpoDTO,
  FindByIdentityDTO,
  FindOneChargepointDTO,
  RemoveChargepointsDTO,
  UpsertChargePointDTO
} from "../dto/chargepoint.dto.js"
import { HttpStatus } from "../utils/http-status.js"

/**
 * Function expression along side a Switch-Case to run the needed validation function 
 * depending from which controller route gets called.
 * 
 * Along side the DTO specifications, created for the Chargepoint resource, makes sure the input data
 * is what is desired.
 * 
 * @param dtoType 
 * @param requestBody 
 * @returns 
 */
export const validateDTO = (dtoType: any, requestBody: any) => {
  switch (dtoType) {
    case "UpsertChargepoint":
      return validateUpsertInputData(requestBody)
    case "FindByIdentity":
      return validateFindByIdentityInputData(requestBody)
    case "FindByCpo":
      return validateFindByCpoInputData(requestBody)
    case "FindOne":
      return validateFindOneInputData(requestBody)
    case "FindAll":
      return validateFindAllInputData(requestBody)
    case "DeleteById":
      return validateDeleteByIdInputData(requestBody)
    case "Remove":
      return validateRemoveInputData(requestBody)
  }
}

const validateUpsertInputData = async (requestBody: any) => {
  const upsertChargePoint = new UpsertChargePointDTO()
  upsertChargePoint.cpo = requestBody.cpo
  upsertChargePoint.identity = requestBody.identity

  const results = await validate(upsertChargePoint)

  let error = {}
  if (results.length) {
    error = {
      data: results
    }
  }
  return error
}

const validateFindByIdentityInputData = async (requestBody: any) => {
  let error = {}
  if (requestBody.entity === "Chargepoint") {
    const findByIdentity = new FindByIdentityDTO()
    findByIdentity.identity = requestBody.identity

    const errors = await validate(findByIdentity)

    if (errors.length) {
      error = {
        data: new ExceptionHandler(HttpStatus.BADREQUEST, errors)
      }
    }
    return error
  } else {
    error = {
      statusCode: HttpStatus.NOTFOUND,
      NotFound: `Entity ${requestBody.entity} was not found on registry.`
    }
  }
}

const validateFindByCpoInputData = async (requestBody: any) => {
  let error = {}
  if (requestBody.entity === "Chargepoint") {
    const findByCpo = new FindByCpoDTO()
    findByCpo.cpo = requestBody.cpo

    const errors = await validate(findByCpo)

    if (errors.length) {
      error = {
        data: new ExceptionHandler(HttpStatus.BADREQUEST, errors)
      }
    }
    return error
  } else {
    error = {
      statusCode: HttpStatus.NOTFOUND,
      NotFound: `Entity ${requestBody.entity} was not found on registry.`
    }
  }
}

const validateFindOneInputData = async (requestBody: any) => {
  let error = {}
  if (requestBody.entity === "Chargepoint") {
    const findOne = new FindOneChargepointDTO()
    findOne.id = requestBody.id
    findOne.entityType = requestBody.entity

    const errors = await validate(findOne)

    if (errors.length) {
      error = {
        data: new ExceptionHandler(HttpStatus.BADREQUEST, errors)
      }
    }
    return error
  } else {
    error = {
      statusCode: HttpStatus.NOTFOUND,
      NotFound: `Entity ${requestBody.entity} was not found on registry.`
    }
  }
}

const validateFindAllInputData = async (requestBody: any) => {
  let error = {}
  if (requestBody.entity === "Chargepoint") {
    const findAll = new FindAllChargepointsDTO()
    findAll.entityType = requestBody.entity

    const errors = await validate(findAll)

    if (errors.length) {
      error = {
        data: new ExceptionHandler(HttpStatus.BADREQUEST, errors)
      }
    }
    return error
  } else {
    error = {
      statusCode: HttpStatus.NOTFOUND,
      NotFound: `Entity ${requestBody.entity} was not found on registry.`
    }
  }
}

const validateDeleteByIdInputData = async (requestBody: any) => {
  let error = {}
  if (requestBody.id !== undefined || requestBody.name !== undefined) {
    const deleteById = new DeleteChargepointByIdDTO()
    deleteById.id = requestBody.id
    deleteById.identity = requestBody.identity

    const errors = await validate(deleteById)

    if (errors.length) {
      error = {
        data: new ExceptionHandler(HttpStatus.BADREQUEST, errors)
      }
    }
    return error
  } else {
    error = {
      statusCode: HttpStatus.BADREQUEST,
      BadRequest: `Entity ${requestBody} is undefined.`
    }
  }
}

const validateRemoveInputData = async (requestBody: any) => {
  const remove = new RemoveChargepointsDTO()
  remove.entities = requestBody

  const errors = await validate(remove)

  let error = {}
  if (errors.length) {
    error = {
      data: new ExceptionHandler(HttpStatus.BADREQUEST, errors)
    }
  }
  return error
}