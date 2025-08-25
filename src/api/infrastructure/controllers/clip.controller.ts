import "reflect-metadata"
import { NextFunction, Request, Response, Router } from 'express'


import { container } from "tsyringe"
import { AuthService } from "../../application/services/auth.service.js"
import { ClipService } from "../../application/services/clip.service.js"
import { HttpStatus } from "../utils/http-status.js"
import _ from 'lodash'
import { Users } from "../../domain/entities/users.entity.js"
import { Clip } from "../../domain/entities/clip.entity.js" 
import { getUserId } from "../helpers/JWT.js"



export class ClipController {
  private readonly _router: Router = Router()
  private AuthService: AuthService = container.resolve(AuthService)
  private ClipService: ClipService = container.resolve(ClipService)

  constructor() {
    this._configure()
  }

  // Routes inside this controller endpoint
  private _configure(): void {

    this._router.post('/create', async (req: Request, res: Response, next: NextFunction) => {
      console.log("clip");
      const {token, timestamp,timestamp_end, live_id } = req.body

      try {
        const userId = await getUserId(token);
        console.log("USER ID -> ", userId);
        console.log("TIMESTAMP -> ", timestamp);
        const clip_id = await this.ClipService.createClip(timestamp,timestamp_end,String(live_id),userId)

        res.send({
          message: 'success'
        })
      } catch (error) {
        console.error(error);
        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        });
      }
    });
  }

  get router(): Router {
    return this._router
  }
}

export default new ClipController().router