import "reflect-metadata"
import { NextFunction, Request, Response, Router } from 'express'
import { container } from "tsyringe"
import { templateService } from "../../application/services/template.service.js"
import { HttpStatus } from "../utils/http-status.js"
import _ from 'lodash'
import { Template } from "../../domain/entities/template.entity.js"

class templateController {
  private readonly _router: Router = Router()
  private templateService: templateService = container.resolve(templateService)

  // Bootstraps the routing configuration once the object is created
  constructor() {
    this._configure()
  }

  private _configure(): void {
    this._router.get('/', async (req: Request, res: Response, next: NextFunction) => {
      console.log("controller")
      try {
        const response = await this.templateService.getAllUsers()
        console.log("DEBUG : ",response)
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

export default new templateController().router