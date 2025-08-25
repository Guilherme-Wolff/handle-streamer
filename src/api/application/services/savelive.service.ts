import "reflect-metadata"
import { container, injectable } from "tsyringe"
import { DeleteResult, Equal } from "typeorm"

import { Users } from "../../domain/entities/users.entity.js"
import { UsersRepository } from "../RepositoryImpl/users.repository.js"
import { EntityType } from "../../infrastructure/utils/entity-types.js"
import { Lives } from "../../domain/entities/lives.entity.js"
import { ChildProcessWithoutNullStreams, exec, spawn, ChildProcess } from 'child_process';
import { renameLiveFile } from "../../infrastructure/utils/rename_file.js"
import { /*CentralTasks*/processLiveManager } from "../../infrastructure/processManager/processManager.js"
import { Process } from "../../infrastructure/processManager/interfaces.js"
import * as fs from 'fs';

import { PATH_STREAMS_OUTPUT } from "../../../../root_path.js"

import { v4 as uuidv4 } from 'uuid';

//config
import { config } from "../../application/config/index.js"
import { LiveService } from "./lives.service.js"
import { StreamersService } from "./streamers.service.js"

interface StatusRequestLive {
  code?: number;
  status: boolean | string;
  message?: string;
}

export interface IsaveLive {
  output_name_live?: string;
  url_live: string;
  user_id?: string;
  //schedule_date?: Date;
}

interface ISavingLiveProcess {
  //process_pid: any;
  runQuiet: string;
  noPartExtension: string;
  nameFile: string;
  path_of_ytdlp: string;
  output_name_live: string;
  url_live: string;
  user_id: string;
  extentionOutput?: string;
  //schedule_date?: Date;
}

@injectable()
export class SaveLiveService {

  //private LiveService: LiveService = container.resolve(LiveService)

  //private StreamersService: StreamersService = container.resolve(StreamersService)

  public containsTiktokUrl(url: string): boolean {
    // Verifique se a URL contém "site.com"
    return url.includes("tiktok.com") && url.includes("/live");
  }

  public extractUsernameFromUrl = async (url: string): Promise<string | null> => {
    // Use uma expressão regular para encontrar o nome de usuário na URL
    if (!this.containsTiktokUrl(url)) {
      return await null
    }
    const usernameRegex = /@([^/]+)\//;
    const match = url.match(usernameRegex);

    // Verifique se houve uma correspondência e retorne o nome de usuário ou null
    if (match && match.length >= 2) {
      return await match[1];
    } else {
      return await null;
    }
  }
  public getHls = async (url: string): Promise<string> => {

    return new Promise<string>((resolve, reject) => {
      const YTDLP_HLS = spawn('yt-dlp', ['-g', '--skip-download', url]);
      let urlHLS: string = '';

      YTDLP_HLS?.stdout.on('data', (data: Buffer) => {
        urlHLS += data.toString();
      });

      YTDLP_HLS.on('close', (code: number) => {
        if (code === 0) {
          resolve(urlHLS.trim());
        } else {
          resolve(urlHLS.trim());
        }
      });

      YTDLP_HLS.on('error', (err: Error) => {
        resolve(urlHLS.trim());
      });
    });
  }

  public saveLive = async (data_for_save: IsaveLive): Promise<StatusRequestLive> => {
    let responseDefault: StatusRequestLive = {
      status: "add request"
    };
    try {

      //const UUID_NAME_ID = await uuidv4()

      //await this.createDiretoryStream(UUID_NAME_ID)

      let user_tiktok_live: string | null = ""
      if (this.containsTiktokUrl(data_for_save.url_live)) {
        user_tiktok_live = await this.extractUsernameFromUrl(data_for_save.url_live)
      }
      console.log("STREAMER: ", user_tiktok_live)
      console.log("save live: ", data_for_save)

      //const complete_url: string = `https://www.tiktok.com/@${user_tiktok_live}/live`

      /*let urlHLS = await this.getHls(complete_url)
      if (!urlHLS.length) {
        responseDefault.status = "add request"
        //responseDefault

      }
      console.log("URL ->", urlHLS)
      */



      const streamProcess: Process = {
        status: "running",
        streamer: String(user_tiktok_live),
        platform: 'tiktok',
        process: null,
        id: ''
      }

      //const streamer_id = await this.StreamersService.getStreamerId(streamProcess.streamer, streamProcess.platform)

      //console.log("ID DO STREAMER: ", streamer_id)

      //let live = await new Lives(streamer_id, streamProcess.streamer, streamProcess.platform);

      //const save = await this.LiveService.saveLives(live)

      const resAddProcess = await processLiveManager.addProcess(streamProcess);
      await processLiveManager.listProcesso()

      return responseDefault;
      //return await this.UsersRepository.find(EntityType, { select: { id: true, identity: true, cpo: true } })
      //return await this.UsersRepository.getAllUsers()
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  public createDiretoryStream = async (name: string): Promise<void> => {
    fs.mkdir(PATH_STREAMS_OUTPUT + name, { recursive: true }, (error) => {
      if (error) {
        console.error('Erro ao criar a pasta:', error);
      } else {
        console.log('Pasta criada com sucesso!');
      }
    });
  }

  public stopSavingLive = async (id: string): Promise<any> => {
    let responseDefault: StatusRequestLive = {
      status: "stoped"
    };
    try {
      const killPocessByPid = (processoId: any) => {
        process.kill(processoId, 'SIGTERM');
      }
      //console.log("stream com id :",id," PARADO")

      //const response_toped = await processLiveManager.stopProcesssByiD(id)
      //CentralTasks.stopTask("id")

      //CentralTasks.addTask(data_for_save.output_name_live, startSavingLiveProcess(ProcessInfo))



      return responseDefault
      //return await this.UsersRepository.find(EntityType, { select: { id: true, identity: true, cpo: true } })
      //return await this.UsersRepository.getAllUsers()
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

}