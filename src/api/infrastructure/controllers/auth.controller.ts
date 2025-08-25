import "reflect-metadata"
import { NextFunction, Request, Response, Router } from 'express'
import { container } from "tsyringe"
import { AuthService } from "../../application/services/auth.service.js"
import { UsersService } from "../../application/services/users.service.js"
import { validateDTO } from "../helpers/chargepoint-dtoValidation.js"
import { EntityType } from "../utils/entity-types.js"
import { HttpStatus } from "../utils/http-status.js"
import _ from 'lodash'
import { Users } from "../../domain/entities/users.entity.js"
import { hash ,compare} from "bcrypt"
import {generateHash,compareHash} from "../helpers/bcrypt.js"
import {generateJWT,validateJWT} from "../helpers/JWT.js"


class AuthController {
  private readonly _router: Router = Router()
  // Dependency Injection
  private AuthService: AuthService = container.resolve(AuthService)
  private UsersService: UsersService = container.resolve(UsersService)

  //
  constructor() {
    this._configure()
  }

  //
  private _configure(): void {

    this._router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
      console.log("controller")
      const user = new Users();
      

      
      try {
        const {email,username,password} = req.body
        user.name = username
        user.email = email
        user.password = password
        

        const userComplete = await this.AuthService.getPasswordByEmail(user.email)
        console.log("DEBUG USERS",userComplete)
                                                 //req pass   :  hash pass of db 
        const isPasswordMatch = await compareHash(user.password, userComplete.password);
        console.log('Senha corresponde ao hash:', isPasswordMatch);
        if(isPasswordMatch){
          const user_jwt = await generateJWT(userComplete.id,userComplete.name)
          res.send(user_jwt)
        }
        
       //CREATE JWT
        
      } catch (error) {
        console.log("erro")
        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
      }
    })

    this._router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
      console.log("controller REGISTER",req.body)


      try {
        const {email,username,password} = req.body
        const user = new Users();
        user.name = username
        user.email = email
        user.password = await generateHash(password)

        const response = await this.UsersService.addUser(user)
        console.log("DEBUG USERS",response)
        res.send(response)
      } catch (error) {
        
        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
      }
    })

    this._router.get('/userinfo', async (req: Request, res: Response, next: NextFunction) => {
      
      const {id} = req.body;
      console.log("BUSCANDO PELO ID : ",id)

      try {
        /*const validationResult = await validateDTO("FindAll", req.body)

        if (!_.isEmpty(validationResult)) {
          return res.status(HttpStatus.BADREQUEST).json(validationResult)
        }*/

        const response = await this.AuthService.getUserById(id)
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
  }

  get router(): Router {
    return this._router
  }
}

export default new AuthController().router