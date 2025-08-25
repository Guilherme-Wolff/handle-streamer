import "reflect-metadata"
import { NextFunction, Request, Response, Router } from 'express'
import { container } from "tsyringe"
import { StreamersService } from "../../application/services/streamers.service.js"
//import { UploaderService, IResposeUpload } from "../../application/services/uploader.service.js"
import { HttpStatus } from "../utils/http-status.js"
import { UploaderService, IResposeUpload } from "../../application/services/uploader.imgbb.service.js"
import { CountryService } from "../../application/services/country.service.js"
import _ from 'lodash'
import { Users } from "../../domain/entities/users.entity.js"
import { hash, compare } from "bcrypt"
import { generateHash, compareHash } from "../helpers/bcrypt.js"
import { generateJWT, validateJWT } from "../helpers/JWT.js"
import { Streamers } from "../../domain/entities/streamers.entity.js"

interface streamerExist {
  exist: boolean;
  url: string;
}

interface DTOSaverStreamer {
  streamer_name: string
}


class StreamersController {
  private readonly _router: Router = Router()
  // Dependency Injection
  //private chargePointService: ChargePointService = container.resolve(ChargePointService)
  private StreamersService: StreamersService = container.resolve(StreamersService)
  private UploaderService: UploaderService = container.resolve(UploaderService)
  private countryService: CountryService = container.resolve(CountryService)
  //private UploaderService: UploaderService = container.resolve(UploaderService)

  // Bootstraps the routing configuration once the object is created
  constructor() {
    this._configure()
  }

  // Routes inside this controller endpoint
  private _configure(): void {
    this._router.post('/savestreamer', async (req: Request, res: Response, next: NextFunction) => {
      console.log("controller savestreamer")
      try {
        //const { streamer_name: streamer } = req.body as DTOSaverStreamer
        let { streamer, platform, /*id*/ } = req.body

        //let streamer = streamer;
        //let platform = "tiktok"
        const response: streamerExist = await this.StreamersService.streamerExistInTiktok(streamer, platform)

        //console.log("resposta constroller :", response)
        if (!response?.exist) {
          res.send({ status: 'fail' })
        }
        if (response?.exist) {
          console.log("existe : --> ")
          const { sucess, url }: IResposeUpload = await this.UploaderService.userImageUploaderBunkr(response.url);

          if (sucess) {
            const country  = await this.countryService.getCountry(streamer,platform)
            await this.StreamersService.addStreamer(streamer, platform, url,country.country)
          }

          res.send({ status: 'ok' })
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

    this._router.post('/updatestreameravatar', async (req: Request, res: Response, next: NextFunction) => {
      console.log("controller updatestreameravatar")
      try {
        let { streamer, platform, /*id*/ } = req.body

        //let streamer = streamer;

        //let platform = "tiktok"
        const response: streamerExist = await this.StreamersService.getAvatarInTiktok(streamer, platform)

        //console.log("resposta constroller :", response)
        if (!response?.exist) {
          res.send({ status: 'streamer not exist' })
        }
        if (response?.exist) {
          console.log("existe : --> ")
          const { sucess, url }: IResposeUpload = await this.UploaderService.userImageUploaderBunkr(response.url);

          if (sucess) {
            await this.StreamersService.updateAvatarUrl(streamer, platform, url)
          }

          res.send({ status: 'ok' })
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

    this._router.post('/updateallavatar', async (req: Request, res: Response, next: NextFunction) => {
      try {
        let interval;
        const streamers: Streamers[] = await this.StreamersService.getAllStreamersNameEAvatar()
        console.log("STREAMERS SEM AVATAR", streamers)
        let delay = 0;

        // Loop pelos streamers
        for (const streamer of streamers) {
          // Utilizando setTimeout para delay de 5 segundos entre os streamers
          setTimeout(async () => {
   
            try {
              const response: streamerExist = await this.StreamersService.getAvatarInTiktok(streamer.name, 'tiktok')

              //console.log("resposta constroller :", response)
              if (!response?.exist) {
                res.send({ status: 'streamer not exist' })
              }
              if (response?.exist) {
                console.log("existe : --> ")
                const { sucess, url }: IResposeUpload = await this.UploaderService.userImageUploaderBunkr(response.url);
                

                if (sucess) {
                  console.log(streamer.name + " : ",url)
                  await this.StreamersService.updateAvatarUrl(streamer.name,'tiktok',url)
                }
              }

            } catch (error) {
              console.error('Erro ao enviar a requisição para o streamer:', streamer.name, error);
            }
          }, delay);

          // Incrementa o delay em 5 segundos (5000 ms) para o próximo streamer
          delay += 10000;
        }



        res.send({ status: 'ok' })

      } catch (error) {
        console.log("erro")
        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
      }
    })

    
    this._router.post('/updateallcountry', async (req: Request, res: Response, next: NextFunction) => {
      try {
        let interval;
        const streamers: Streamers[] = await this.StreamersService.getStreamersWithoutSpecificCountries()
        //console.log("STREAMERS SEM AVATAR", streamers)
        let delay = 0;

        // Loop pelos streamers
        for (const streamer of streamers) {
          // Utilizando setTimeout para delay de 5 segundos entre os streamers
          setTimeout(async () => {
   
            try {
              const response: streamerExist = await this.StreamersService.getAvatarInTiktok(streamer.name, 'tiktok')

              //console.log("resposta constroller :", response)
              if (!response?.exist) {
                res.send({ status: 'streamer not exist' })
              }
              if (response?.exist) {
                console.log("existe : --> "+streamer.name)
                //const { sucess, url }: IResposeUpload = await this.UploaderService.userImageUploaderBunkr(response.url);
                const country  = await this.countryService.getCountry(streamer.name,'tiktok')
                console.log(
                  `
                  COUNTRY OF ${streamer.name} é ${country.country}
                  `
                )
                

                if (country) {
                 // console.log(streamer.name + " : ",url)
                  await this.StreamersService.updateCountry(streamer.name,'tiktok',country.country)
                }
              }

            } catch (error) {
              console.error('Erro ao enviar a requisição para o streamer:', streamer.name, error);
            }
          }, delay);

          // Incrementa o delay em 5 segundos (5000 ms) para o próximo streamer
          delay += 10000;
        }



        res.send({ status: 'ok' })

      } catch (error) {
        console.log("erro")
        res.status(HttpStatus.BADREQUEST).json({
          statusCode: HttpStatus.BADREQUEST,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
      }
    })

    this._router.get('/streamersbuned', async (req: Request, res: Response, next: NextFunction) => {
      try {
        let interval;
        const streamers = await this.StreamersService.getStreamersForBan()
        if(!streamers) return;
        let delay = 0;

        for (const streamer of streamers) {
          setTimeout(async () => {
   
            try {
              console.log("TEST : ",streamer.name)
              const response: streamerExist = await this.StreamersService.getAvatarInTiktok(streamer.name, 'tiktok')

              //console.log("resposta constroller :", response)
              if (!response?.exist) {
                console.log("BAN : ",streamer.name)
                this.StreamersService.addBan(streamer.name, 'tiktok')
              }
            } catch (error) {
              console.log("BAN : ",streamer.name)
              this.StreamersService.addBan(streamer.name, 'tiktok')
            }
          }, delay);

          // Incrementa o delay em 5 segundos (5000 ms) para o próximo streamer
          delay += 5000;
        }



        res.send({ status: 'ok' })

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

export default new StreamersController().router