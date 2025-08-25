import { exec, spawn } from 'child_process'
import { rm, unlink } from 'fs/promises';
import util from 'util';
import { promises as fsPromises } from 'fs';
import * as fs from 'node:fs';
import { LiveService } from "./lives.service.js"

import { PATH_RESPONSE_UPLOADS, PATH_STREAMS_THUMBNAILS, PATH_STREAMS_OUTPUT } from "../../../../root_path.js"
import { IResposeUpload, UploaderService } from "../services/uploader.imgbb.service.js"

import path from 'path'


const execPromise = util.promisify(exec);




export class ThumbnailService {
    constructor() { }

    public imgbb_client_id = "713bcfdb3686407e86c8061d80f78369";
    public BUCKET_URL: string = 'bunkr.ru';
    public AUTH_TOKEN: string = '';
    public PATH_STREAMS_OUTPUT: string = PATH_STREAMS_OUTPUT;
    public PATH_STREAMS_THUMBNAILS: string = PATH_STREAMS_THUMBNAILS;
    public PATH_RESPONSE_UPLOADS: string = PATH_RESPONSE_UPLOADS;
    public EXTENSION_DEFAULT = ".mp4";

    async checkFileExists(filePath: string): Promise<boolean> {
        try {
            await fsPromises.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    async waitForFile(filePath: string, timeout: number = 60000): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (await this.checkFileExists(filePath)) {
                console.log(`Arquivo encontrado: ${filePath}`);
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.error(`Timeout: Arquivo não encontrado após ${timeout}ms: ${filePath}`);
        return false;
    }

    async getVideoDuration(inputFile: string): Promise<number> {

        const mp4_exist = await this.waitForFile(inputFile)
        if (!mp4_exist) {
            console.error(`O arquivo ${inputFile} não existe.`);
            return 0;
        }

        return new Promise((resolve, reject) => {
            const ffprobe = spawn('ffprobe', [
                '-protocol_whitelist', 'file,crypto,data,http,https,tcp,tls',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                inputFile
            ]);

            let output = '';
            ffprobe.stdout.on('data', (data) => {
                output += data;
            });

            ffprobe.stderr.on('data', (data) => {
                console.error(`ffprobe stderr: ${data}`);
            });

            ffprobe.on('close', (code) => {
                if (code === 0) {
                    resolve(parseFloat(output.trim()));
                } else {
                    reject(new Error(`ffprobe process exited with code ${code}`));
                }
            });
        });
    }

    async createThumbnailM3U8(inputFile: string, outputFile: string, id_live: string): Promise<void> {
        try {
            const duration = await this.getVideoDuration(inputFile);

            const roundedDuration = Math.round(duration);

            if (duration === 0) return;

            console.log(`Duração do vídeo: ${duration} segundos`);

            const timestamps = [
                duration * 0.1,
                duration * 0.3,
                duration * 0.6,
                duration * 0.9
            ].map(t => t.toFixed(2));
            console.log('Timestamps calculados:', timestamps);

            /*
            ffmpeg -protocol_whitelist file,crypto,data,http,https,tcp,tls -i playlist.m3u8 -vf "select=eq(n\,0)+eq(n\,30)+eq(n\,60)+eq(n\,90),scale=320:-1,tile=2x2" -frames:v 1 -y thumbnail.png
             */

            const ffmpeg = spawn('ffmpeg', [
                '-protocol_whitelist', 'file,crypto,data,http,https,tcp,tls',
                '-i', inputFile,
                '-vf', 'select=eq(n\\,0)+eq(n\\,30)+eq(n\\,60)+eq(n\\,90),scale=320:-1,tile=2x2',
                '-frames:v', '1',
                '-y',
                outputFile
            ]);

            /*ffmpeg.stdout.on('data', (data) => {
                console.log(`ffmpeg stdout: ${data}`);
            });

            ffmpeg.stderr.on('data', (data) => {
                console.error(`ffmpeg stderr: ${data}`);
            });*/

            ffmpeg.on('close', async (code) => {
                if (code === 0) {
                    const png_exist = this.waitForFile(outputFile)

                    if (!png_exist) {
                        //console.error(`O arquivo ${inputFile} não existe.`);
                        return 0;
                    } else {
                        const uploader = new UploaderService()
                        const res: IResposeUpload = await uploader.thumbnailUpload(outputFile)
                        if (res.sucess) {
                            console.log("ATUALIZAR URL THUMBNAIL", res)
                            const liveService: LiveService = new LiveService();
                            await liveService.updateThumbnailUrlAndDuration(id_live, res.url,roundedDuration)

                        }
                    }
                    console.log('Thumbnail ponta para o upload!');
                } else {
                    console.error(`Erro ao criar thumbnail, código de saída: ${code}`);
                }
            });
        } catch (error) {
            console.error('Erro ao criar thumbnail:', error);
        }
    }

    async createThumbnailM3U8Clip(inputFile: string, outputFile: string, id_live: string): Promise<void> {
        try {
            const duration = await this.getVideoDuration(inputFile);

            if (duration === 0) return;

            console.log(`Duração do vídeo: ${duration} segundos`);

            const timestamps = [
                duration * 0.1,
                duration * 0.3,
                duration * 0.6,
                duration * 0.9
            ].map(t => t.toFixed(2));
            console.log('Timestamps calculados:', timestamps);

            /*
            ffmpeg -protocol_whitelist file,crypto,data,http,https,tcp,tls -i playlist.m3u8 -vf "select=eq(n\,0)+eq(n\,30)+eq(n\,60)+eq(n\,90),scale=320:-1,tile=2x2" -frames:v 1 -y thumbnail.png
             */

            const ffmpeg = spawn('ffmpeg', [
                '-protocol_whitelist', 'file,crypto,data,http,https,tcp,tls',
                '-i', inputFile,
                '-vf', 'select=eq(n\\,0)+eq(n\\,30)+eq(n\\,60)+eq(n\\,90),scale=320:-1,tile=2x2',
                '-frames:v', '1',
                '-y',
                outputFile
            ]);

            /*ffmpeg.stdout.on('data', (data) => {
                console.log(`ffmpeg stdout: ${data}`);
            });

            ffmpeg.stderr.on('data', (data) => {
                console.error(`ffmpeg stderr: ${data}`);
            });*/

            ffmpeg.on('close', async (code) => {
                if (code === 0) {
                    const png_exist = this.waitForFile(outputFile)

                    if (!png_exist) {
                        //console.error(`O arquivo ${inputFile} não existe.`);
                        return 0;
                    } else {
                        const uploader = new UploaderService()
                        const res: IResposeUpload = await uploader.thumbnailUpload(outputFile)
                        if (res.sucess) {
                            console.log("ATUALIZAR URL THUMBNAIL", res)
                            const liveService: LiveService = new LiveService();
                            await liveService.updateThumbnailUrlClip(id_live, res.url)
                            await this.deleteSpecificFile(outputFile)

                        }
                    }
                    console.log('Thumbnail ponta para o upload!');
                } else {
                    console.error(`Erro ao criar thumbnail, código de saída: ${code}`);
                }
            });
        } catch (error) {
            console.error('Erro ao criar thumbnail:', error);
        }
    }

    async deleteSpecificFile(filePath) {
        try {
            await unlink(filePath);
            console.log(`Arquivo "${filePath}" deletado com sucesso.`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log(`Arquivo "${filePath}" não encontrado, nada a deletar.`);
            } else {
                console.error(`Erro ao deletar o arquivo "${filePath}":`, error);
            }
        }
    }

    async createThumbnail(inputFile: string, outputFile: string, id_live: string): Promise<void> {
        try {
            const duration = await this.getVideoDuration(inputFile);

            if (duration === 0) return;

            console.log(`Duração do vídeo: ${duration} segundos`);

            const timestamps = [
                duration * 0.1,
                duration * 0.3,
                duration * 0.6,
                duration * 0.9
            ].map(t => t.toFixed(2));
            console.log('Timestamps calculados:', timestamps);

            /*
            ffmpeg -protocol_whitelist file,crypto,data,http,https,tcp,tls -i playlist.m3u8 -vf "select=eq(n\,0)+eq(n\,30)+eq(n\,60)+eq(n\,90),scale=320:-1,tile=2x2" -frames:v 1 -y thumbnail.png
             */

            const ffmpeg = spawn('ffmpeg', [
                '-i', inputFile,
                '-vf', 'select=eq(n\\,0)+eq(n\\,30)+eq(n\\,60)+eq(n\\,90),scale=320:-1,tile=2x2',
                '-frames:v', '1',
                '-y',  // Sobrescreve arquivo de saída se existir
                outputFile
            ]);

            /*ffmpeg.stdout.on('data', (data) => {
                console.log(`ffmpeg stdout: ${data}`);
            });

            ffmpeg.stderr.on('data', (data) => {
                console.error(`ffmpeg stderr: ${data}`);
            });*/

            ffmpeg.on('close', async (code) => {
                if (code === 0) {
                    const png_exist = this.waitForFile(outputFile)

                    if (!png_exist) {
                        //console.error(`O arquivo ${inputFile} não existe.`);
                        return 0;
                    } else {
                        const uploader = new UploaderService()
                        const res: IResposeUpload = await uploader.thumbnailUpload(outputFile)
                        if (res.sucess) {
                            console.log("ATUALIZAR URL THUMBNAIL", res)
                            const liveService: LiveService = new LiveService();
                            await liveService.updateThumbnailUrl(id_live, res.url)

                        }
                    }
                    console.log('Thumbnail ponta para o upload!');
                } else {
                    console.error(`Erro ao criar thumbnail, código de saída: ${code}`);
                }
            });
        } catch (error) {
            console.error('Erro ao criar thumbnail:', error);
        }
    }

    async pixeldrainReadFileResponseUploadStream(fileName: string, streamer: string, platform: string = 'tiktok', live_id: string): Promise<any> {
        const filePath = `${PATH_RESPONSE_UPLOADS}${fileName}.txt`;

        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', async (err, data) => {
                if (err) {
                    console.error(`Erro ao ler o arquivo: ${err.message}`);
                    return reject(err);
                }

                try {
                    const urlPattern = /http:\/\/uploader\.sh\/[^\s]+/;
                    const match = data.match(urlPattern);

                    if (match) {
                        const url = match[0];
                        console.log("URL extraída:", url);

                        await this.updateThumbnailStreamUrl(url, streamer, platform, live_id);
                    } else {
                        console.log("URL não encontrada.");
                    }

                    resolve(data);
                } catch (error) {
                    console.error(`Erro ao analisar o JSON STREAM: ${error}`);
                    reject(error);
                }
            });
        });
    }

    async updateThumbnailStreamUrl(url_complete: string, streamer: string, platform: string, live_id: string): Promise<any> {
        const liveService: LiveService = new LiveService();
        return liveService.updateStreamUrls(url_complete/*, streamer, platform*/, live_id);
    }
}

// Substitua com suas informações

//userImageUploader(urlImagem, token, urlUpload);
