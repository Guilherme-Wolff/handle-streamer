import "reflect-metadata"
import { NextFunction, Request, Response, Router } from 'express'
import { container } from "tsyringe"
import { SaveLiveService, IsaveLive/*, startSavingLiveProcess*/ } from "../../application/services/savelive.service.js"
import { LiveService } from "../../application/services/lives.service.js"
import { HttpStatus } from "../utils/http-status.js"
import _ from 'lodash'
import { Users } from "../../domain/entities/users.entity.js"
import { generateHash, compareHash } from "../helpers/bcrypt.js"
import { generateJWT, validateJWT } from "../helpers/JWT.js"
import { ChildProcessWithoutNullStreams } from "child_process"
import { Console } from "console"

//import {v4 as uuidv4} from 'uuid';




class SaveLiveController {
  private readonly _router: Router = Router()

  private SaveLiveService: SaveLiveService = container.resolve(SaveLiveService)

  constructor() {
    this._configure()
  }

  private _configure(): void {
    this._router.post('/save', async (req: Request, res: Response, next: NextFunction) => {
      console.log(" save live controller")
      try {
        let { streamer, platform, /*id*/ } = req.body;

        /*const FFMPEG_ARGS = [
      '-y',
      '-loglevel', 'quiet',
      '-hide_banner',

      '-i', _process?.hls,
      '-c', 'copy',
      '-f', 'segment',
      '-segment_time',MAX_TIME_LIVE,
      '-segment_list', `${PATH_STREAMS_OUTPUT}${UUID_NAME_ID}/playlist.m3u8`,
      '-segment_list_size','0',
      `${PATH_STREAMS_OUTPUT}${_process.id}/out%03d.ts`,
    ];

    const FFMPEGprocess = spawn("ffmpeg", FFMPEG_ARGS);

    const streamProcess: Process = {
      status: "running",
      streamer: String(_process.streamer),
      platform: 'tiktok',
      process: FFMPEGprocess,
      id: _process.id
    }*/


        //START LIVE POSGRES
        if (streamer && platform === 'tiktok') {
          console.log("SAVER INICIADO")
          const data: IsaveLive = {
            output_name_live: '',
            url_live: `https://tiktok.com/@${streamer}/live`,
            user_id: 'JWT',
          }
          //data.output_name_live = uuidv4();
          //console.log("dados",data)

          const response = await this.SaveLiveService.saveLive(data)

          res.send(response)
        }
        else {
          res.send({
            status: 'fail'
          })
        }

        /*9const data: IsaveLive = {
          output_name_live: '',
          url_live: 'string',
          user_id: 'string',
        }
        //data.output_name_live = uuidv4();
        //console.log("dados",data)

        const response = await this.SaveLiveService.saveLive(data)*/
        //console.log("DEBUG SAVE LIVE",response)
        //res.send(response)

      } catch (error) {
        console.log("erro")
        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
      }
    })

    this._router.post('/stopsaving', async (req: Request, res: Response, next: NextFunction) => {
      console.log("controller stop")
      try {
        let { data } = req.body;
        //data.output_name_live = uuidv4();
        //console.log("DADOS DO REQUEST",data)
        const save = await this.SaveLiveService.stopSavingLive(data.process_id)//

        const response = await this.SaveLiveService.stopSavingLive(data.process_id)//
        console.log("DEBUG SAVE LIVE", response)
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

export default new SaveLiveController().router