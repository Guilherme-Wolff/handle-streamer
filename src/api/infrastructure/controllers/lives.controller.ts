import "reflect-metadata"
import { NextFunction, Request, Response, Router } from 'express'
import { container } from "tsyringe"
import { LiveService } from "../../application/services/lives.service.js"
//import { LiveService } from "../../application/services/lives.service.js"
import { HttpStatus } from "../utils/http-status.js"
import _ from 'lodash'
import { Lives } from "../../domain/entities/lives.entity.js"
//import { Lives } from "../../domain/entities/lives.entity.js"

class livesController {
  private readonly _router: Router = Router()
  private livesService: LiveService = container.resolve(LiveService)

  // Bootstraps the routing configuration once the object is created
  constructor() {
    this._configure()
  }

  private _configure(): void {
    this._router.get('/', async (req: Request, res: Response, next: NextFunction) => {
      console.log("controller")
      try {

      } catch (error) {

        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
      }
    })


    this._router.post('/addlive', async (req: Request, res: Response, next: NextFunction) => {
      console.log("controller")
      try {
        let streamer = "cams_asmr";
        let platform = "tiktok";

        //const lives = await this.livesService.getStreamerLives(streamer, platform)

        //console.log("LIVES: ", lives)
        //const {} = req.body


        //let thumb = "https://i-fries.bunkr.ru/thumb-6uwpkoYR.png"
        let streamer_id = "d154fc90-b4fe-4d19-b1ac-bf8c041be7df";
        //let urls_stream = ["https://get.bunkrr.su/file/ftHXSc5tAi9ts"]
        //const newLive = new Lives(streamer_id, streamer, platform)

        //const lives = await this.livesService.saveLives(newLive)

        //console.log("LIVE SALVA INICIAL: ",lives)

        const lives_daved = await this.livesService.getStreamerLives(streamer, platform)

        console.log("LIVES: ", lives_daved)




        res.send({status:'ok'})
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

export default new livesController().router