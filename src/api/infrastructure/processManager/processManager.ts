import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';

import * as fs from 'fs';
import axios from 'axios';
import fetch from 'node-fetch';
import path from 'path';


import { UploadPixeldrainService } from "../../application/services/uploader.pixeldrain.service.js"

import { UploadChunkService } from "../../application/services/uploader.chunk.service.js"

import { UploadBunkrService } from "../../application/services/upload.bunkr.service.js"

//import { UploadBunkrService } from "../../application/services/upload.bunkr.service.js"

import { UploadJsonBlobService } from "../../application/services/uploader.jsonblob.service.js"

import { PATH_STREAMS_OUTPUT, COOKIE_PATH, COOKIE_PATH_UPLOAD } from "../../../../root_path.js"

import { Process, ProcessStart, SegmentMap, Segment } from "./interfaces.js"

import { TiktokChat } from "../../application/services/chat.service.js"

import { v4 as uuidv4 } from 'uuid';

import { config } from '../../application/config/index.js'
import { container } from 'tsyringe';
import { IsaveLive, SaveLiveService } from '../../application/services/savelive.service.js';
import { LiveService } from '../../application/services/lives.service.js';
import { StreamersService } from '../../application/services/streamers.service.js';
import { Lives } from '../../domain/entities/lives.entity.js';
//import { ThumbnailService } from '../../application/services/thumbnail.service.js';

import { /*proxiesManager,*/ ProxiesManager, ProxiesList, IProxySimple } from "../../application/services/get_proxies.js"

import { SegmentWatcher } from "../utils/SegmentWatcher.js"

import { PROXIES_BUCKET } from "./PROXIE_BUCKET.js"
import { platform } from 'os';

import { getHls720p, TikTokLiveURLGenerator } from "./TikTokLiveURL.js"
import { Console } from 'console';
import { last } from 'lodash';


//import {Process} from "./interfaces"



interface Streamer {
  streamer: string;
  platform: string;
}

interface StreamersData {
  streamers: Streamer[];
}

interface CurrentProcess {
  id: string;
  live_id: string | undefined;
  title?: string | undefined;
  streamer: string;
  platform: string;
  country: string;
}

interface CategoryKeywords {
  keywords: string[];
}

interface Categories {
  [key: string]: CategoryKeywords;
}




export class LivesManager {



  constructor() {

  }


  private RequestCentralProcess = new Map<string, Process>();//

  private OnlineCentralProcess = new Map<string, ProcessStart>();

  public updateStreamersOFFLINE: Process[] = [];
  public updateStreamersONLINE: Process[] = [];

  public tikTokLiveURLGenerator: TikTokLiveURLGenerator = new TikTokLiveURLGenerator();

  //private SaveLiveService: SaveLiveService = container.resolve(SaveLiveService)
  private LiveService: LiveService = container.resolve(LiveService)

  private StreamersService: StreamersService = container.resolve(StreamersService)

  public MILLISECONDS_DALAY_MAP = 2000;
  public ONLINE_CHECK_TIME = 30000/*30000*/;

  public uploadBunkrService: UploadBunkrService = new UploadBunkrService;

  public EXTENSION_DEFAULT = config.processManager.EXTENSION_VIDEO_DEFAULT;
  public MAX_TIME_LIVE: string = config.processManager.MAX_TIME_LIVE;

  public ONLINE_STATUS: number = config.processManager.TIKTOK_ONLINE_STATUS || 2;

  private isVerifyingStreamers = false;

  public streamerCompletionInterval: null | NodeJS.Timeout = null;
  
  public updateOnlineStreamersInterval: null | NodeJS.Timeout = null;

  public last_streamer_id: string = '';

  public intervalId;

  //new
  private isVerifying = false;
  private shouldContinueVerifying = false;
  private verificationQueue = new Set<string>();
  private lastVerificationTime = new Map<string, number>();
  private readonly MIN_VERIFICATION_INTERVAL = 30000;



  public async initializeStreamers(): Promise<void> {
    try {
    } catch (error: any) {
      console.error("Erro ao carregar streamers:", error);
    }
  }

  /**
   * Retorna a soma dos tamanhos dos dois Maps
   * @returns Número total de entradas nos Maps
   */
  public async getTotalStreamers(): Promise<number> {
    return this.RequestCentralProcess.size + this.OnlineCentralProcess.size;
  }

  public async setLastStreamerId(id: string): Promise<void> {
    this.last_streamer_id = id
  }

  async addProcessArray(processes: Process[]): Promise<void> {
    try {
      // Itera sobre o array de processos de forma assíncrona
      await this.setLastStreamerId(processes[processes.length - 1].streamer_id)

      for (const _process of processes) {
        _process.id = await uuidv4();
        await this.RequestCentralProcess.set(_process.id, _process);
      }


      if (this.RequestCentralProcess.size > 0 && !this.isVerifyingStreamers) {
        this.isVerifyingStreamers = true; // Define que a verificação está em andamento
        await this.startContinuousVerification();
        this.isVerifyingStreamers = false; // Restaura a variável após a verificação
      }

    } catch (error) {
      console.error('Erro ao adicionar processos em lote:', error);
      throw error;
    }
  }

  public async addProcess(_process: Process): Promise<void> {
    const exists = Array.from(this.RequestCentralProcess.values()).some(existingProcess =>
      existingProcess.streamer === _process.streamer && existingProcess.platform === _process.platform
    );
    if (!exists) {
      _process.id = await uuidv4();
      console.log("addProcess com streamer", _process.streamer, ": add in requests");

      await this.RequestCentralProcess.set(_process.id, _process);
    } else {
      console.log(`Processo já existe para o streamer ${_process.streamer} na plataforma ${_process.platform}.`);
      return;
    }

    if (this.RequestCentralProcess.size > 0 && !this.isVerifyingStreamers) {
      this.isVerifying = true; // Define que a verificação está em andamento
      await this.startContinuousVerification();
      this.isVerifying = false; // Restaura a variável após a verificação
    }
  }



  /* START PROCESS */

  public async startProcessLiveSave(_process: Process) {

    const streamProcess: ProcessStart = {
      status: true,
      streamer: String(_process.streamer),
      streamer_id: _process.streamer_id,
      platform: _process.platform || 'tiktok',
      urlM3U8: String(_process.urlM3U8),
      id: _process.id
    }

    await this.OnlineCentralProcess.set(_process.id, streamProcess);

  }

  public async addOnlineProcess(_process: Process) {
    const streamProcess: ProcessStart = {
      status: true,
      streamer: String(_process.streamer),
      streamer_id: _process.streamer_id,
      platform: _process.platform || 'tiktok',
      urlM3U8: String(_process.urlM3U8),
      id: _process.id
    }
    await this.OnlineCentralProcess.set(_process.id, streamProcess);
  }


  public createDiretoryStream = async (name: string): Promise<void> => {
    fs.mkdir(PATH_STREAMS_OUTPUT + name, { recursive: true }, (error) => {
      if (error) {
        return;
      }
    });
  }





  public async verifyIfStreamersIsOnline2() {
    console.log("init -> status verify");
    // Verifica se o intervalo já está ativo para evitar múltiplas execuções
    if (this.intervalId) {
      console.log("Intervalo já está em execução.");
      return;
    }
    this.intervalId = setInterval(async () => {
      if (this.RequestCentralProcess.size < 1) {
        console.log("o SIZE É 0 : ", this.RequestCentralProcess.size);
        return;
      }
      for (const proc of this.RequestCentralProcess) {

        const online = await this.tikTokLiveURLGenerator.getHls720p(proc[1].streamer)

        if (online.status) {
          console.log("URLS HLS --> :", online.urls);
          console.log("Online   --> : ", proc[1].streamer);
          proc[1].urlM3U8 = online.urls;
          proc[1].tittle = online.tittle;
          await this.RequestCentralProcess.delete(proc[0]);
          //await this.startProcessLiveSave(proc[1]);
          config.MAINTENANCE_MODE != "true" ? await this.startProcessLiveSave(proc[1]) : ''
        } else {
          console.log("Offline:", proc[1].streamer);
        }
      }
    }, this.ONLINE_CHECK_TIME);
  }

  public async startContinuousVerification() {
    console.log("Iniciando verificação contínua...");
    this.shouldContinueVerifying = true;
    await this.continuousVerificationLoop();
  }

  // Para o loop contínuo
  public stopContinuousVerification() {
    console.log("Parando verificação contínua...");
    this.shouldContinueVerifying = false;
  }

  // Loop principal que roda para sempre
  private async continuousVerificationLoop() {
    while (this.shouldContinueVerifying) {
      try {
        await this.verifyIfStreamersIsOnline();
        await this.updateOnlineStreamersLoop();
        

        // Aguarda o tempo configurado antes da próxima verificação
        console.log(`Aguardando ${this.ONLINE_CHECK_TIME}ms para próxima verificação...`);
        await this.delay(this.ONLINE_CHECK_TIME);

      } catch (error) {
        console.error("Erro no loop de verificação:", error);
        // Aguarda um tempo menor em caso de erro para tentar novamente
        await this.delay(5000);
      }
    }
    console.log("Loop de verificação contínua finalizado.");
  }

  // Método de verificação único (sem loop interno)
  public async verifyIfStreamersIsOnline() {
    console.log("init -> status verify");

    // Evita execução simultânea
    if (this.isVerifying) {
      console.log("Verificação já está em andamento.");
      return;
    }

    this.isVerifying = true;

    try {
      await this.processVerificationQueue();
    } finally {
      this.isVerifying = false;
    }
  }

  private async processVerificationQueue() {
    if (this.RequestCentralProcess.size < 1) {
      console.log("o SIZE É 0 : ", this.RequestCentralProcess.size);
      return;
    }

    console.log(`Iniciando verificação de ${this.RequestCentralProcess.size} streamers...`);

    // Processa cada streamer sequencialmente para evitar sobrecarga
    for (const [key, proc] of this.RequestCentralProcess) {
      try {
        // Verifica se já foi verificado recentemente
        if (this.wasRecentlyVerified(proc.streamer)) {
          console.log(`Streamer ${proc.streamer} verificado recentemente, pulando...`);
          continue;
        }
        console.log(`Verificando streamer: ${proc.streamer}`);
        await this.delay(this.MILLISECONDS_DALAY_MAP);

        const online = await this.tikTokLiveURLGenerator.getHls720p(proc.streamer);

        if (online.status) {
          console.log("URLS HLS --> :", online.urls);
          console.log("Online   --> : ", proc.streamer);

          proc.urlM3U8 = online.urls;
          proc.tittle = online.tittle;
          proc.status = true;
          this.updateStreamersONLINE.push(proc)

          //await this.RequestCentralProcess.delete(key);

          if (config.MAINTENANCE_MODE !== "true") {
            await this.addOnlineProcess(proc);
          }
        } else {
          console.log("Offline:", proc.streamer);
          if (this.OnlineCentralProcess.has(proc.id)) {
            proc.status = false;
            this.updateStreamersOFFLINE.push(proc)
            this.OnlineCentralProcess.delete(proc.id)
          }
          // Atualiza timestamp da última verificação
          this.lastVerificationTime.set(proc.streamer, Date.now());
        }
      } catch (error) {
        console.error(`Erro ao verificar streamer ${proc.streamer}:`, error);
        // Continua com o próximo streamer mesmo se houver erro
      }
    }
    console.log("Verificação completa.");
  }

  private wasRecentlyVerified(streamer: string): boolean {
    const lastCheck = this.lastVerificationTime.get(streamer);
    if (!lastCheck) return false;

    return (Date.now() - lastCheck) < this.MIN_VERIFICATION_INTERVAL;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para verificação manual/sob demanda
  public async verifySpecificStreamer(streamer: string): Promise<boolean> {
    console.log(`Verificação sob demanda para: ${streamer}`);

    try {
      const online = await this.tikTokLiveURLGenerator.getHls720p(streamer);
      this.lastVerificationTime.set(streamer, Date.now());

      return online.status;
    } catch (error) {
      console.error(`Erro na verificação sob demanda de ${streamer}:`, error);
      return false;
    }
  }

  // Método para adicionar streamers à fila de verificação
  public addStreamerToQueue(streamer: string) {
    this.verificationQueue.add(streamer);
  }

  // Método para verificar streamers na fila (processamento em lote)
  public async processQueuedStreamers() {
    if (this.verificationQueue.size === 0) {
      console.log("Nenhum streamer na fila para verificação.");
      return;
    }

    console.log(`Processando ${this.verificationQueue.size} streamers da fila...`);

    const streamersToProcess = Array.from(this.verificationQueue);
    this.verificationQueue.clear();

    for (const streamer of streamersToProcess) {
      try {
        await this.verifySpecificStreamer(streamer);
        await this.delay(this.MILLISECONDS_DALAY_MAP);
      } catch (error) {
        console.error(`Erro ao processar streamer da fila ${streamer}:`, error);
      }
    }
  }

  // Método para limpeza de timestamps antigos (previne vazamento de memória)
  public cleanupOldVerifications() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    for (const [streamer, timestamp] of this.lastVerificationTime) {
      if (now - timestamp > maxAge) {
        this.lastVerificationTime.delete(streamer);
      }
    }
  }

  // Getter para status da verificação
  public get isCurrentlyVerifying(): boolean {
    return this.isVerifying;
  }

  // Getter para status do loop contínuo
  public get isContinuousVerificationRunning(): boolean {
    return this.shouldContinueVerifying;
  }

  // Método para parar qualquer processo de verificação
  public stopVerification() {
    this.isVerifying = false;
    this.shouldContinueVerifying = false;
    console.log("Verificação interrompida.");
  }

  public async listProcesso(): Promise<any> {
    this.OnlineCentralProcess.forEach((proc) => {
      //console.table("id",proc.id ,"pid", Number(proc.process.pid))
      console.log("ONLINE PROCESS |->[", proc.streamer, "]|", "|", proc.id, "<-|")
    })
  }

  public async listOffineProcesso(): Promise<any> {
    this.RequestCentralProcess.forEach((proc) => {
      //console.table("id",proc.id ,"pid", Number(proc.process.pid))
      console.log("ONLINE Offiine |->[", Number(proc.process), "]|", "|", proc.id, "<-|")
    })
  }

  public async clearProcess(): Promise<any> {
    //return this.processos;
    this.RequestCentralProcess.forEach(async (proc: any | ProcessStart) => {

      proc.process.on('close', async (code) => {
        if (code === 0) {
          console.log('O processo foi concluído com sucesso. SERÁ RETIRADO');
          await this.RequestCentralProcess.delete(proc.id);
          this.RequestCentralProcess
        } else {
          console.error(`O processo foi encerrado com código de saída ${code}.`);
        }
      });
    })

    await this.listProcesso()
  }

  updateOnlineStreamersLoop() {
    console.log(`
      =========================
      updateOnlineStreamersLoop
      =========================
      `)
    // Se já existe um intervalo rodando, limpa ele primeiro
    if (this.updateOnlineStreamersInterval) {
      clearInterval(this.updateOnlineStreamersInterval);
    }

    this.updateOnlineStreamersInterval = setInterval(async () => {
      try {
        //const total_stramers = await this.getTotalStreamers()
        //se o streamer verificado no central como falso teambem estiver no 
        //set de onlines fazer update no db para online=false
        if (this.updateStreamersOFFLINE) {
          this.StreamersService.updateOffline(this.updateStreamersOFFLINE)
        }
        if (this.updateStreamersONLINE) {
          this.StreamersService.updateOnline(this.updateStreamersONLINE)
        }else{

        }
      } catch (error) {
        console.error('Erro ao completar streamers:', error);
      }
    }, 5000 /*180000*/); // 3 minutos = 180000ms

    console.log('Loop de completar streamers iniciado (a cada 3 minutos)');
  }

  async startStreamerCompletionLoop() {
    // Se já existe um intervalo rodando, limpa ele primeiro
    if (this.streamerCompletionInterval) {
      clearInterval(this.streamerCompletionInterval);
    }



    // Cria o intervalo para executar a cada 3 minutos (180000ms)
    this.streamerCompletionInterval = setInterval(async () => {
      try {
        // Verifica se ainda há necessidade de completar streamers
        const total_stramers = await this.getTotalStreamers()
        console.log("ULTIMO ID --> :", this.last_streamer_id)
        //console.log("-->> TOTAL STR: ", total_stramers)
        //console.log("-->> FALTAM :", (config.MAX_STREAMERS) - (total_stramers))

        if (total_stramers < 20) {
          const needed = config.MAX_STREAMERS - total_stramers;
          //console.log(`Tentando completar ${needed} streamers...`);

          // Chama a função para completar os streamers
          const str = await this.StreamersService.getMoreStreamers(this.last_streamer_id);

          if (str) {
            console.log("NEW STR --> :", str)
            const str_new = str?.map((streamer) => {
              const streamProcess: Process = {
                status: false,
                streamer: streamer.name,
                streamer_id: streamer.id,
                platform: streamer.platform || 'tiktok',
                urlM3U8: '',
                //process: null,
                country: streamer.country,
                id: ''
              }

              return streamProcess;
            })
            //this.setLastStreamerId(str_new[str_new.length - 1].id)

            await this.addProcessArray(str_new);
          }
          
        } else {
          // Se já temos streamers suficientes, para o loop
          console.log('Streamers suficientes. Parando o loop.');
          //this.stopStreamerCompletionLoop();
        }
      } catch (error) {
        console.error('Erro ao completar streamers:', error);
      }
    }, 5000 /*180000*/); // 3 minutos = 180000ms

    console.log('Loop de completar streamers iniciado (a cada 3 minutos)');
  }


  async setStreamers() {
    const streamers = await this.StreamersService.getStreamers()

    if (streamers) {
      const str = streamers?.map((streamer) => {
        const streamProcess: Process = {
          status: false,
          streamer: streamer.name,
          streamer_id: streamer.id,
          platform: streamer.platform || 'tiktok',
          urlM3U8: '',
          country: streamer.country,
          id: ''
        }
        return streamProcess
      })

      await this.addProcessArray(str);

      await this.startStreamerCompletionLoop();

      //await this.updateOnlineStreamersLoop();

      

    } else {
      console.log("Streamers NULL")
    }


  }
  async onShutdown() {
    const offStreamers = Array.from(this.RequestCentralProcess.values()).map((prc) => {
      return {streamer:prc.streamer ,platform:prc.platform}
    });
    const onStreamers = Array.from(this.OnlineCentralProcess.values()).map((prc) => {
      return {streamer:prc.streamer ,platform:prc.platform}
    });

    // Juntar os dois arrays
    const allStreamers = [...offStreamers, ...onStreamers];

    const res = await this.StreamersService.returnStreamersToDatabase(allStreamers)

    ///const del = await this.LiveService.deleteLivesWithoutUrl(allStreamers);

    process.exit(0);

  }


  async preparationForShutdown() {
    process.on('SIGINT', this.onShutdown); // Ctrl+C
    process.on('SIGTERM', this.onShutdown); // Docker stop
    process.on('uncaughtException', (err) => {
      console.error('Erro não tratado:', err);
      this.onShutdown(); // Trata o encerramento em caso de erro
    });
  }
}

export const processLiveManager = new LivesManager();
processLiveManager.preparationForShutdown().then


//IN DATASOURCE.TS INIT STREAMERS
//processLiveManager.setStreamers().then

