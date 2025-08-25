import "reflect-metadata"
import { validate } from "class-validator"
import ExceptionHandler from "../exceptions/exceptions-handler.js"
import {
  FindOneOrganizationDTO,
  DeleteOrganizationByIdDTO,
  FindAllOrganizationsDTO,
  FindByNameDTO,
  RemoveOrganizationsDTO,
  UpsertOrganizationDTO
} from "../dto/organization.dto.js"
import { HttpStatus } from "../utils/http-status.js"

/**
 * Function expression along side a Switch-Case to run the needed validation function 
 * depending from which controller route gets called.
 * 
 * Along side the DTO specifications, created for the Organization resource, makes sure the input data
 * is what is desired.
 * 
 * @param dtoType 
 * @param requestBody 
 * @returns 
 */
export const validateDTO = (dtoType: any, requestBody: any) => {
  switch (dtoType) {
    case "UpsertOrganization":
      return validateUpsertInputData(requestBody)
    case "FindByName":
      return validateFindByNameInputData(requestBody)
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
  const upsertOrganization = new UpsertOrganizationDTO()
  upsertOrganization.name = requestBody.name
  upsertOrganization.legalEntity = requestBody.legalEntity

  const results = await validate(upsertOrganization)

  let error = {}
  if (results.length) {
    error = {
      data: results
    }
  }
  return error
}

const validateFindByNameInputData = async (requestBody: any) => {
  let error = {}
  if (requestBody.entity === "Organization") {
    const findByName = new FindByNameDTO()
    findByName.name = requestBody.name
    findByName.entityType = requestBody.entity

    const errors = await validate(findByName)

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
  if (requestBody.entity === "Organization") {
    const findOne = new FindOneOrganizationDTO()
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
  if (requestBody.entity === "Organization") {
    const findAll = new FindAllOrganizationsDTO()
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
    const deleteById = new DeleteOrganizationByIdDTO()
    deleteById.id = requestBody.id
    deleteById.name = requestBody.name
    deleteById.legalEntity = requestBody.legalEntity

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
  const remove = new RemoveOrganizationsDTO()
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