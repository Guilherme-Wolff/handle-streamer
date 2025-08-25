
import * as chokidar from 'chokidar';
import * as path from 'path';
import { UploadChunkService } from "../../application/services/uploader.chunk.service.js"
import {UploadBunkrService} from "../../application/services/upload.bunkr.service.js"

export class SegmentWatcher {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  public uploadChunkService: UploadChunkService = new UploadChunkService;
  public uploadBunkrService: UploadBunkrService = new UploadBunkrService;

  public observeNewSegments(diretorio: string, path_id:string,live_id:string): void {

    let uploadPromises: Promise<any>[] = [];

    if (this.watchers.has(diretorio)) {
      console.log(`Já observando o diretório: ${diretorio}`);
      return;
    }

    const watcher = chokidar.watch(diretorio, {
      ignoreInitial: true,
      persistent: true,
      //awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
    });

    watcher.on('add', async (caminho: string) => {
      const fileName = path.basename(caminho);

      if (fileName.endsWith(".ts")) {
        console.log("chunk add")
        //await this.uploadChunkService.uploadChunk(caminho, fileName)

        await this.uploadBunkrService.uploadChunk(path_id,fileName,live_id)
       
      }
      
        //await Promise.all(uploadPromises);
       // this.uploadChunkService.replaceM3u8(path_id,live_id)
      

      // FAZER DOWENLOAD DO M3U8 AQUI ,RECEBER LIVE_ID
      if (fileName == "main.m3u8") {
        this.uploadBunkrService.uploadMainM3u8(path_id ,fileName, live_id)

      }

    });

    // Detecta quando o diretório é removido
    watcher.on('unlinkDir', (removedDir: string) => {
      if (removedDir === diretorio) {
        //console.warn(`Diretório removido: ${removedDir}`);
        this.stopObserving(diretorio);
      }
    });

    watcher.on('error', (error: any) => {
      console.error(`Erro ao observar ${diretorio}:`, error);
    });

    this.watchers.set(diretorio, watcher);
    console.log(`Iniciada observação no diretório: ${diretorio}`);
  }

  public stopObserving(diretorio: string): void {
    const watcher = this.watchers.get(diretorio);
    if (watcher) {
      watcher.close();
      this.watchers.delete(diretorio);
      console.log(`Parada observação no diretório: ${diretorio}`);
    } else {
      console.warn(`Nenhuma observação ativa para o diretório: ${diretorio}`);
    }
  }
}