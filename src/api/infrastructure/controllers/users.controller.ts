import "reflect-metadata"
import { NextFunction, Request, Response, Router } from 'express'
import { container } from "tsyringe"
import { UsersService } from "../../application/services/users.service.js"
import { validateDTO } from "../helpers/chargepoint-dtoValidation.js"
import { EntityType } from "../utils/entity-types.js"
import { HttpStatus } from "../utils/http-status.js"
import _ from 'lodash'
import { Users } from "../../domain/entities/users.entity.js"
import { hash ,compare} from "bcrypt"
import {generateHash,compareHash} from "../helpers/bcrypt.js"
import {generateJWT,validateJWT} from "../helpers/JWT.js"

interface UserRegister {
  name:string;
  email:string;
  password:string;
}

class UsersController {
  private readonly _router: Router = Router()
  // Dependency Injection
  //private chargePointService: ChargePointService = container.resolve(ChargePointService)
  private UsersService: UsersService = container.resolve(UsersService)

  // Bootstraps the routing configuration once the object is created
  constructor() {
    this._configure()
  }

  // Routes inside this controller endpoint
  private _configure(): void {
    this._router.get('/', async (req: Request, res: Response, next: NextFunction) => {
      console.log("controller")
      try {
        /*const validationResult = await validateDTO("FindAll", req.body)

        if (!_.isEmpty(validationResult)) {
          return res.status(HttpStatus.BADREQUEST).json(validationResult)
        }*/

        const response = await this.UsersService.getAllUsers()
        console.log("DEBUG USERS",response)
        res.send(response)
      } catch (error) {
        console.log("erro")
        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
      }
    })

    this._router.get('/userinfo', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {token} = req.body;
        const validToken = await validateJWT(token)
        console.log(validToken)
        if(validToken.isValid === false){
          res.status(403).json({
          statusCode: 403
        })
        }else{
          res.send(validToken.payload)
        }
        
      } catch (error) {
        console.log("erro")
        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
      }
    })

    this._router.post('/findByIdentity', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validationResult = await validateDTO("FindByIdentity", req.body)

        if (!_.isEmpty(validationResult)) {
          return res.status(HttpStatus.BADREQUEST).json(validationResult)
        }

        const response = await this.UsersService.getAllUsers()
        console.log("USERS - AQUI",response)
        res.send(response)
      } catch (error) {
        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
      }
    })

  }

  get router(): Router {
    return this._router
  }
}

export default new UsersController().router