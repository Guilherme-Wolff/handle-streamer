import * as fs from 'node:fs';
import { promises as fsPromises } from 'fs';
import { rm, unlink } from 'fs/promises';

import { spawn } from "child_process";
import { PATH_RESPONSE_UPLOADS, PATH_STREAMS_THUMBNAILS, PATH_STREAMS_OUTPUT,PATH_CLIPS } from "../../../../root_path.js"
import { config } from "../config/index.js"
import { LiveService } from "../services/lives.service.js"
import { ClipService } from "../services/clip.service.js"
import { StreamersService } from "../services/streamers.service.js"
import axios from 'axios';
import crypto from 'crypto';
import path from 'node:path';
import { Readable } from "stream"
//import { url } from 'node:inspector';
import { BUNKR_ALIAS } from '../config/bunkr.alias.upload.js';
import { Segment } from '../../infrastructure/processManager/interfaces.js';

import { ThumbnailService } from '../../application/services/thumbnail.service.js';


//const ONLINE_STATUS = 2;



export interface INFOuploadService {
    token?: string;
    api_url: string;
    absolute_path_streams: string;
}

export interface IResposeUpload {
    sucess: boolean;
    url: string
}

interface UploadBunkrResponse {
    success: boolean;
    files: {
        name: string;
        url: string;
    }[];
}
/*const mergeUrl = async (currentServer: string, fileId: string, fileName): Promise<string> => {
  const COMPLETE_URL = `https://${currentServer}.gofile.io/download/${fileId}/${fileName}`;
  return COMPLETE_URL;

};*/

export class UploadBunkrService {

    public BUCKET_URL: string = 'bunkr.ru';
    public AUTH_TOKEN: string = '';
    public PATH_STREAMS_OUTPUT: string = PATH_STREAMS_OUTPUT;
    public PATH_STREAMS_THUMBNAILS: string = PATH_STREAMS_THUMBNAILS;
    public PATH_RESPONSE_UPLOADS: string = PATH_RESPONSE_UPLOADS;

    public _thumbnailService: ThumbnailService = new ThumbnailService;


    private TOKEN_BUNKR: string;
    public TOKENS_BUNKR_ARRAY: string[];
    public token_position: number = 0;

    public URL_FOR_GET_SERVER_BUNKRS = "https://app.bunkrr.su/api/node";

    public EXTENSION_DEFAULT = ".mp4"
    public EXTENSION_DEFAULT_CHUNK = ".ts"

    public segmentsFileName: string = "segments.json"

    constructor() {
        this.TOKEN_BUNKR = config.BUCKET_FILES.BUNKR_TOKEN;

        this.TOKENS_BUNKR_ARRAY = this.TOKEN_BUNKR.split(',').filter(token => token.trim() !== '');

    }


    async getServerBunkr(): Promise<string> {
        const { data } = await axios.get(this.URL_FOR_GET_SERVER_BUNKRS, {
            headers: {
                token: await this.getTokenBunkr()
            }
        })
        if (data.success) {
            return data.url
        }
        else {
            return ''
        }
    }

    async getTokenBunkr(): Promise<string> {
        const url = this.TOKENS_BUNKR_ARRAY[this.token_position];
        this.token_position = (this.token_position + 1) % this.TOKENS_BUNKR_ARRAY.length; // Incrementa e reinicia no início automaticamente

        return url;
    };



    async generateBoundary() {
        // Gera um timestamp no formato YYYYMMDDHHmmss
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

        // Gera 6 bytes aleatórios e converte para hexadecimal
        const randomBytes = crypto.randomBytes(6).toString('hex');

        // Combina o timestamp com os bytes aleatórios
        return `---------------------------${timestamp}${randomBytes}`;
    }

    async createFormDataPart(name, filename, contentType, content, boundary) {
        return Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`),
            Buffer.from(`Content-Type: ${contentType}\r\n\r\n`),
            content,
            Buffer.from('\r\n')
        ]);
    }

    async checkFileExists(filePath: string): Promise<boolean> {
        try {
            await fsPromises.access(filePath);
            return true; // O arquivo existe
        } catch (error) {
            return false; // O arquivo não existe
        }
    }

    async waitForFile(filePath: string, timeout: number = 60000): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                await fsPromises.access(filePath);
                console.log(`Arquivo encontrado: ${filePath}`);
                return true;
            } catch (error) {
                // Arquivo ainda não existe, espere um pouco
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.error(`Timeout: Arquivo não encontrado após ${timeout}ms: ${filePath}`);
        return false;
    }

    async calculateContentLength(boundary, fileName, filePath) {
        const boundaryBuffer = Buffer.from(`--${boundary}\r\n`);
        const contentDisposition = Buffer.from(`Content-Disposition: form-data; name="files[]"; filename="${fileName}"\r\n`);
        const contentType = Buffer.from(`Content-Type: video/mp4\r\n\r\n`);
        const fileBuffer = fs.readFileSync(filePath); // Conteúdo do arquivo
        const newline = Buffer.from('\r\n');
        const finalBoundary = Buffer.from(`--${boundary}--\r\n`);

        // Somar o tamanho de todas as partes
        const totalLength =
            boundaryBuffer.length +
            contentDisposition.length +
            contentType.length +
            fileBuffer.length +
            newline.length +
            finalBoundary.length;

        return totalLength;
    }

    public async uploadChunk(path_id: string, fileName: string, live_id: string): Promise<any> {

        console.log(`
            ===========================================
            UPLOAD CHUNK | UPLOAD CHUNK | UPLOAD CHUNK 
            ============================================
            path_id=${path_id} - filename=${fileName}
            `)

        const json_file_name = PATH_STREAMS_OUTPUT + path_id + "/" + fileName + '.json';


        let resp: IResposeUpload = {
            sucess: false,
            url: ''
        }

        

        

        //curl -X POST -H "token: 8smWG8uhfjFhEVrwn7bZ3Oa6TFenghAO7vtv7VsU3V2CSwTr1FckqvRbLAH7aDjd" -H "Content-Type: multipart/form-data" -F "files[]=@teste4.txt" https://n14.bunkr.ru/api/upload > response.json


        try {
            const token = await this.getTokenBunkr()

            console.log(`
                ================================
                TOKEN: ${token}
                ================================
                `)

            const filePath: string = await `${this.PATH_STREAMS_OUTPUT}${path_id}/${fileName}`

            const mp4_exist = await this.waitForFile(filePath)

            if (!mp4_exist) {
                console.error(`O arquivo ${filePath} não existe.`);
                return {
                    sucess: false,
                    url: '',
                    error: 'Arquivo não encontrado'
                };
            }

            const curent_server: string = await this.getServerBunkr()

            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

            let formDataStream: Readable

            formDataStream = new Readable({
                read() {
                    // Parte inicial do form-data
                    this.push(Buffer.concat([
                        Buffer.from(`--${boundary}\r\n`),
                        Buffer.from(`Content-Disposition: form-data; name="files[]"; filename="${fileName}"\r\n`) as any,
                        Buffer.from(`Content-Type: video/mp4\r\n\r\n`) as any,
                        fs.readFileSync(filePath) as any,
                        Buffer.from('\r\n') as any,
                    ]));

                    // Fim do form-data
                    this.push(Buffer.from(`--${boundary}--\r\n`)) as any

                    // Sinaliza o fim do stream
                    this.push(null);
                }
            });

            const contentLength = await this.calculateContentLength(boundary, fileName, filePath);

            // Criar o corpo da requisição



            let CURL_ARGS_BUNKR_DEFAULT = [
                '-X', 'POST',
                '-H', `Content-Type: multipart/form-data; boundary=${boundary}`,
                '-H', 'Origin: https://dash.bunkr.cr',
                '-H', `Content-Length: ${contentLength}`,
                '-H', 'Referer:  https://dash.bunkr.cr/',
                '-H', `Token: ${token}`,
                '-H', 'X-Requested-With: XMLHttpRequest',
                '--data-binary', '@-',
                //'-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\nAccept-Language: en-us,en;q=0.5\nSec-Fetch-Mode: navigate',
                `${curent_server}`,
            ]


            const uploadProcess = spawn('curl', CURL_ARGS_BUNKR_DEFAULT, {
                stdio: ['pipe', 'pipe', 'pipe'] // for create response.json
            });

            formDataStream.pipe(uploadProcess.stdin);

            uploadProcess.on('close', async (code) => {

                // this.deleteFileStream(fileName)
                // PODE DAR ERRO COM AWAIT
                let responseJson = {}
                if (code === 0) {
                    console.log(" --> upload concluido <-- code: " + code)
                    responseJson = await this.pixeldrainReadFileResponseUploadChunk(json_file_name, path_id, fileName, await this.getFoodForUrlFile(curent_server), live_id)

                    await this.deleteSpecificFile(PATH_STREAMS_OUTPUT + path_id + "/" + fileName)
                } else {
                    console.log(" --> upload FALHA <-- code: " + code)
                    //responseJson = await this.pixeldrainReadFileResponseUploadStream(fileName, streamer, platform, await this.getFoodForUrlFile(curent_server))

                }
                //console.log("JSON STREAM RESPONSE WITH ID ", responseJson)
                //const temparary_food = await this.getFoodForUrlFile(curent_server
                //delete json
                // savar id do stream
                //await this.deleteFileStream(fileName)

                //await this.deleteFileResponseUpload(json_gile_name)
                return await responseJson;
            })
            const outputStream = fs.createWriteStream(json_file_name);
            uploadProcess.stdout.pipe(outputStream);

            return resp;

        } catch (error: any) {
            console.error('Erro durante o upload:', error.message);
        }
    }

    public async uploadMainM3u8(path_id: string, fileName: string, live_id: string): Promise<any> {

        console.log(`
            ===========================================
            UPLOAD CHUNK | UPLOAD CHUNK | UPLOAD CHUNK 
            ============================================
            path_id=${path_id} - filename=${fileName}
            `)

        const json_file_name = PATH_STREAMS_OUTPUT + path_id + "/" + fileName + '.json';

        


        let resp: IResposeUpload = {
            sucess: false,
            url: ''
        }

        //curl -X POST -H "token: 8smWG8uhfjFhEVrwn7bZ3Oa6TFenghAO7vtv7VsU3V2CSwTr1FckqvRbLAH7aDjd" -H "Content-Type: multipart/form-data" -F "files[]=@teste4.txt" https://n14.bunkr.ru/api/upload > response.json


        try {
            const token = await this.getTokenBunkr()

            const filePath: string = await `${this.PATH_STREAMS_OUTPUT}${path_id}/${fileName}`

            const mp4_exist = await this.waitForFile(filePath)

            if (!mp4_exist) {
                console.error(`O arquivo ${filePath} não existe.`);
                return {
                    sucess: false,
                    url: '',
                    error: 'Arquivo não encontrado'
                };
            }

            const curent_server: string = await this.getServerBunkr()

            //const boundary = await this.generateBoundary()
            //const boundary = `---------------------------${fileName}`


            //fileName = `${fileName}${this.EXTENSION_DEFAULT_CHUNK}`



            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

            let formDataStream: Readable

            formDataStream = new Readable({
                read() {
                    // Parte inicial do form-data
                    this.push(Buffer.concat([
                        Buffer.from(`--${boundary}\r\n`),
                        Buffer.from(`Content-Disposition: form-data; name="files[]"; filename="${fileName}"\r\n`) as any,
                        Buffer.from(`Content-Type: video/mp4\r\n\r\n`) as any,
                        fs.readFileSync(filePath) as any,
                        Buffer.from('\r\n') as any,
                    ]));

                    // Fim do form-data
                    this.push(Buffer.from(`--${boundary}--\r\n`)) as any

                    // Sinaliza o fim do stream
                    this.push(null);
                }
            });

            const contentLength = await this.calculateContentLength(boundary, fileName, filePath);

            // Criar o corpo da requisição



            let CURL_ARGS_BUNKR_DEFAULT = [
                '-X', 'POST',
                '-H', `Content-Type: multipart/form-data; boundary=${boundary}`,
                '-H', 'Origin: https://dash.bunkr.cr',
                '-H', `Content-Length: ${contentLength}`,
                '-H', 'Referer:  https://dash.bunkr.cr/',
                '-H', `Token: ${token}`,
                '-H', 'X-Requested-With: XMLHttpRequest',
                '--data-binary', '@-',
                //'-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\nAccept-Language: en-us,en;q=0.5\nSec-Fetch-Mode: navigate',
                `${curent_server}`,
            ]


            const uploadProcess = spawn('curl', CURL_ARGS_BUNKR_DEFAULT, {
                stdio: ['pipe', 'pipe', 'pipe'] // for create response.json
            });

            formDataStream.pipe(uploadProcess.stdin);

            uploadProcess.on('close', async (code) => {

                // this.deleteFileStream(fileName)
                // PODE DAR ERRO COM AWAIT
                let responseJson = {}
                if (code === 0) {
                    console.log(" --> upload concluido <-- code: " + code)
                    responseJson = await this.pixeldrainReadFileResponseUploadM3U8(json_file_name, path_id, fileName, await this.getFoodForUrlFile(curent_server), live_id)

                    //await this.deleteSpecificFile(PATH_STREAMS_OUTPUT + path_id + "/" + fileName)
                } else {
                    console.log(" --> upload FALHA <-- code: " + code)
                    //responseJson = await this.pixeldrainReadFileResponseUploadStream(fileName, streamer, platform, await this.getFoodForUrlFile(curent_server))

                }
                //console.log("JSON STREAM RESPONSE WITH ID ", responseJson)
                //const temparary_food = await this.getFoodForUrlFile(curent_server
                //delete json
                // savar id do stream
                //await this.deleteFileStream(fileName)

                //await this.deleteFileResponseUpload(json_gile_name)
                return await responseJson;
            })
            const outputStream = fs.createWriteStream(json_file_name);
            uploadProcess.stdout.pipe(outputStream);

            return resp;

        } catch (error: any) {
            console.error('Erro durante o upload:', error.message);
        }
    }

    async getFilenameFromPath(filePath: string): Promise<string> {
        return filePath.split(/[\\/]/).pop() || '';
      }

    public async uploadClipM3u8(clip_id: string, file: string): Promise<any> {

        console.log(`
            ===========================================
            UPLOAD CLIP | UPLOAD CLIP | UPLOAD CLIP 
            ============================================
            path_id=${clip_id} - filename=${file}
            `)

        const json_file_name = file + '.json';

        let resp: IResposeUpload = {
            sucess: false,
            url: ''
        }

        try {
            const token = await this.getTokenBunkr()

            const fileName = await this.getFilenameFromPath(file)

            const filePath: string = await `${PATH_CLIPS}${clip_id}/${fileName}`

            const mp4_exist = await this.waitForFile(filePath)

            if (!mp4_exist) {
                console.error(`O arquivo ${filePath} não existe.`);
                return {
                    sucess: false,
                    url: '',
                    error: 'Arquivo não encontrado'
                };
            }

            const curent_server: string = await this.getServerBunkr()

            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

            let formDataStream: Readable

            formDataStream = new Readable({
                read() {
                    // Parte inicial do form-data
                    this.push(Buffer.concat([
                        Buffer.from(`--${boundary}\r\n`),
                        Buffer.from(`Content-Disposition: form-data; name="files[]"; filename="${file}"\r\n`) as any,
                        Buffer.from(`Content-Type: video/mp4\r\n\r\n`) as any,
                        fs.readFileSync(filePath) as any,
                        Buffer.from('\r\n') as any,
                    ]));

                    // Fim do form-data
                    this.push(Buffer.from(`--${boundary}--\r\n`)) as any

                    // Sinaliza o fim do stream
                    this.push(null);
                }
            });

            const contentLength = await this.calculateContentLength(boundary, file, filePath);

            let CURL_ARGS_BUNKR_DEFAULT = [
                '-X', 'POST',
                '-H', `Content-Type: multipart/form-data; boundary=${boundary}`,
                '-H', 'Origin: https://dash.bunkr.cr',
                '-H', `Content-Length: ${contentLength}`,
                '-H', 'Referer:  https://dash.bunkr.cr/',
                '-H', `Token: ${token}`,
                '-H', 'X-Requested-With: XMLHttpRequest',
                '--data-binary', '@-',
                //'-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\nAccept-Language: en-us,en;q=0.5\nSec-Fetch-Mode: navigate',
                `${curent_server}`,
            ]

            const uploadProcess = spawn('curl', CURL_ARGS_BUNKR_DEFAULT, {
                stdio: ['pipe', 'pipe', 'pipe'] // for create response.json
            });

            formDataStream.pipe(uploadProcess.stdin);

            uploadProcess.on('close', async (code) => {

                // this.deleteFileStream(fileName)
                // PODE DAR ERRO COM AWAIT
                let responseJson = {}
                if (code === 0) {
                    console.log(" --> upload concluido <-- code: " + code)
                    responseJson = await this.ReadFileResponseUploadClipM3U8(json_file_name, file, await this.getFoodForUrlFile(curent_server), clip_id)

                    //await this.deleteSpecificFile(PATH_STREAMS_OUTPUT + path_id + "/" + fileName)
                } else {
                    console.log(" --> upload FALHA <-- code: " + code)
                    //responseJson = await this.pixeldrainReadFileResponseUploadStream(fileName, streamer, platform, await this.getFoodForUrlFile(curent_server))

                }
                //console.log("JSON STREAM RESPONSE WITH ID ", responseJson)
                //const temparary_food = await this.getFoodForUrlFile(curent_server
                //delete json
                // savar id do stream
                //await this.deleteFileStream(fileName)

                //await this.deleteFileResponseUpload(json_gile_name)
                return await responseJson;
            })
            const outputStream = fs.createWriteStream(json_file_name);
            uploadProcess.stdout.pipe(outputStream);

            return resp;

        } catch (error: any) {
            console.error('Erro durante o upload:', error.message);
        }
    }

    public async uploadStream(fileName: string, streamer: string, platform: string, live_id: string): Promise<any> {

        const json_file_name = fileName + '.mp4.json';

        let resp: IResposeUpload = {
            sucess: false,
            url: ''
        }

        //curl -X POST -H "token: 8smWG8uhfjFhEVrwn7bZ3Oa6TFenghAO7vtv7VsU3V2CSwTr1FckqvRbLAH7aDjd" -H "Content-Type: multipart/form-data" -F "files[]=@teste4.txt" https://n14.bunkr.ru/api/upload > response.json


        try {
            const filePath: string = await `${this.PATH_STREAMS_OUTPUT}${fileName}/${fileName}${this.EXTENSION_DEFAULT}`

            const mp4_exist = await this.waitForFile(filePath)

            if (!mp4_exist) {
                console.error(`O arquivo ${filePath} não existe.`);
                return {
                    sucess: false,
                    url: '',
                    error: 'Arquivo não encontrado'
                };
            }

            const curent_server: string = await this.getServerBunkr()

            //const boundary = await this.generateBoundary()
            //const boundary = `---------------------------${fileName}`


            fileName = `${fileName}${this.EXTENSION_DEFAULT}`



            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

            let formDataStream: Readable

            formDataStream = new Readable({
                read() {
                    // Parte inicial do form-data
                    this.push(Buffer.concat([
                        Buffer.from(`--${boundary}\r\n`),
                        Buffer.from(`Content-Disposition: form-data; name="files[]"; filename="${fileName}"\r\n`) as any,
                        Buffer.from(`Content-Type: video/mp4\r\n\r\n`) as any,
                        fs.readFileSync(filePath) as any,
                        Buffer.from('\r\n') as any,
                    ]));

                    // Fim do form-data
                    this.push(Buffer.from(`--${boundary}--\r\n`)) as any

                    // Sinaliza o fim do stream
                    this.push(null);
                }
            });

            // Criar o corpo da requisição


            let CURL_ARGS_BUNKR_DEFAULT = [
                '-X', 'POST',
                '-H', `Content-Type: multipart/form-data; boundary=${boundary}`,
                '-H', 'Token: ' + `${this.TOKEN_BUNKR}`,
                '-H', 'X-Requested-With: XMLHttpRequest',
                '--data-binary', '@-',
                //'-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\nAccept-Language: en-us,en;q=0.5\nSec-Fetch-Mode: navigate',
                `${curent_server}`,
            ]


            const uploadProcess = spawn('curl', CURL_ARGS_BUNKR_DEFAULT, {
                stdio: ['pipe', 'pipe', 'pipe'] // for create response.json
            });

            formDataStream.pipe(uploadProcess.stdin);

            uploadProcess.on('close', async (code) => {

                // this.deleteFileStream(fileName)
                // PODE DAR ERRO COM AWAIT
                let responseJson = {}
                if (code === 0) {
                    console.log(" --> upload concluido <-- code: " + code)
                    responseJson = await this.pixeldrainReadFileResponseUploadStream(fileName, streamer, platform, await this.getFoodForUrlFile(curent_server), live_id)
                } else {
                    console.log(" --> upload FALHA <-- code: " + code)
                    //responseJson = await this.pixeldrainReadFileResponseUploadStream(fileName, streamer, platform, await this.getFoodForUrlFile(curent_server))

                }
                //console.log("JSON STREAM RESPONSE WITH ID ", responseJson)
                //const temparary_food = await this.getFoodForUrlFile(curent_server
                //delete json
                // savar id do stream
                //await this.deleteFileStream(fileName)

                //await this.deleteFileResponseUpload(json_gile_name)
                return await responseJson;
            })
            const outputStream = fs.createWriteStream(PATH_RESPONSE_UPLOADS + json_file_name);
            uploadProcess.stdout.pipe(outputStream);

            return resp;

        } catch (error: any) {
            console.error('Erro durante o upload:', error.message);
        }
    }
    async getFoodForUrlFile(url: any): Promise<string> {
        const serverNumber = url.match(/n(\d+)/)[1];
        return BUNKR_ALIAS[serverNumber];
    }

    async createUrlBunkr(name: string, food_url: string): Promise<string> {
        //const BASE_URL_BUNKR = `https://i-${food_url}.bunkr.ru/`
        //let url_complete: string = `https://i-${food_url}.bunkr.ru/${name}`
        let url_complete: string = `https://${food_url}.bunkr.ru/${name}`

        return url_complete;
    }

    async pixeldrainReadFileResponseUploadChunk(file: string, path_id: string, fileName: string, food: string, live_id: string): Promise<any> {
        console.log("PEGANDO JSON: ", fileName + '.json')
        let jsonData: any = '';
        fs.readFile(file, 'utf8', async (err, data: any) => {
            if (err) {
                console.error(`Erro read file: ${err.message}`);
                return;
            }

            try {

                const path_name = await this.getParentFolder(file)

                //const StreamerService: StreamersService = new StreamersService;

                jsonData = await JSON.parse(data);
                console.log("JSON DATA: ", jsonData)

                if (jsonData.success && jsonData.files && jsonData.files.length > 0) {
                    //const { name } = jsonData.files[0].name;
                    const name_file: string = jsonData.files[0].name;
                    const video = await this.createUrlBunkr(name_file, food)

                    console.log(`
                        BUNKR ======================BUNKR
                        ${video}
                        BUNKR ======================BUNKR
                        `)


                    // await this.updateStreamUrl(video,live_id)
                    await this.addSegmentinJson(path_name + "/" + this.segmentsFileName, fileName, video)

                    //await StreamerService.addAlbumID(streamer, file_id, platform)

                    await this.deleteSpecificFile(file)


                } else {
                    //const _file = await this.removeJsonExtension(file)
                    this.uploadChunk(path_id, fileName, live_id)
                }


                //await StreamerService.addAlbumID(streamer, file_id, platform)

                return await jsonData;

            } catch (error) {
                console.error(`Erro ao analisar o JSON Chunk upload: ${error}`);
            }
        });
        return await jsonData;
    }

    /*async removeJsonExtension(filePath:string):Promise<string> {
        if (filePath.endsWith('.json')) {
            // Remove a extensão .json usando path.parse e path.join
            const parsedPath = path.parse(filePath);
            return path.join(parsedPath.dir, parsedPath.name);
        }
        return filePath;
    }*/

    async pixeldrainReadFileResponseUploadM3U8(file: string, path_id: string, fileName: string, food: string, live_id: string): Promise<any> {
        console.log("PEGANDO JSON: ", fileName + '.json')
        let jsonData: any = '';
        fs.readFile(file, 'utf8', async (err, data: any) => {
            if (err) {
                console.error(`Erro read file: ${err.message}`);
                return;
            }

            try {

                const path_name = await this.getParentFolder(file)

                //const StreamerService: StreamersService = new StreamersService;

                jsonData = await JSON.parse(data);
                console.log("JSON DATA: ", jsonData)

                if (jsonData.success && jsonData.files && jsonData.files.length > 0) {
                    //const { name } = jsonData.files[0].name;
                    const name_file: string = jsonData.files[0].name;
                    const video = await this.createUrlBunkr(name_file, food)

                    console.log(`
                        BUNKR ======================BUNKR
                        ${video}
                        BUNKR ======================BUNKR
                        `)


                    await this.updateStreamUrl(video, live_id)

                    //await StreamerService.addAlbumID(streamer, file_id, platform)

                    await this.deleteSpecificFile(file)


                }


                //await StreamerService.addAlbumID(streamer, file_id, platform)

                return await jsonData;

            } catch (error) {
                console.error(`Erro ao analisar o JSON Chunk upload: ${error}`);
            }
        });
        return await jsonData;
    }

    async ReadFileResponseUploadClipM3U8(file: string, fileName: string, food: string, cli_id: string): Promise<any> {
        console.log("PEGANDO JSON: ", fileName + '.json')
        let jsonData: any = '';
        fs.readFile(file, 'utf8', async (err, data: any) => {
            if (err) {
                console.error(`Erro read file: ${err.message}`);
                return;
            }

            try {

                //const path_name = await this.getParentFolder(file)

                jsonData = await JSON.parse(data);
                console.log("JSON DATA: ", jsonData)

                if (jsonData.success && jsonData.files && jsonData.files.length > 0) {
                    
                    const name_file: string = jsonData.files[0].name;
                    const video = await this.createUrlBunkr(name_file, food)

                    console.log(`
                        BUNKR ======================BUNKR
                        ${video}
                        BUNKR ======================BUNKR
                        `)
                    await this.updateClipUrl(video, cli_id)
                    //await StreamerService.addAlbumID(streamer, file_id, platform)
                    //await this.deleteSpecificFile(file)
                }
                //await StreamerService.addAlbumID(streamer, file_id, platform)
                return await jsonData;

            } catch (error) {
                console.error(`Erro ao analisar o JSON Chunk upload: ${error}`);
            }
        });
        return await jsonData;
    }


    async pixeldrainReadFileResponseUploadStream(fileName: string, streamer: string, platform: string = 'tiktok', food: string, live_id: string): Promise<any> {
        console.log("PEGANDO JSON: ", fileName + '.json')
        let jsonData: any = '';
        fs.readFile(PATH_RESPONSE_UPLOADS + fileName + '.json', 'utf8', async (err, data: any) => {
            if (err) {
                console.error(`Erro read file: ${err.message}`);
                return;
            }

            try {

                //const StreamerService: StreamersService = new StreamersService;

                jsonData = await JSON.parse(data);
                console.log("JSON DATA: ", jsonData)

                if (jsonData.success && jsonData.files && jsonData.files.length > 0) {
                    //const { name } = jsonData.files[0].name;
                    const name_file: string = jsonData.files[0].name;
                    const video = await this.createUrlBunkr(name_file, food)

                    console.log("URL IMAGE BUNKR :", video)


                    await this.updateStreamUrl(video, live_id)


                }


                //await StreamerService.addAlbumID(streamer, file_id, platform)

                return await jsonData;

            } catch (error) {
                console.error(`Erro ao analisar o JSON STREAM: ${error}`);
            }
        });
        return await jsonData;
    }

    async addSegmentinJson(jsonPath: string, segmentName: string, url: string): Promise<void> {
        try {
            let jsonSegments: Segment[] = [];

            // Verifica se o arquivo JSON existe
            if (fs.existsSync(jsonPath)) {
                // Lê o conteúdo atual do arquivo JSON
                const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
                // Parseia o conteúdo do arquivo JSON
                jsonSegments = JSON.parse(jsonContent).segments || [];
            } else {
                // Se o arquivo não existe, inicializa com um array vazio
                console.log(`Arquivo JSON "${jsonPath}" não encontrado. Criando novo arquivo.`);
            }
            //const seg = await await this.transformSegmentFilename(segmentName)
            // Adiciona o novo segmento ao array de segmentos
            jsonSegments.push({ [segmentName]: url });

            // Cria o conteúdo atualizado do JSON
            const updatedJsonContent = JSON.stringify({ segments: jsonSegments }, null, 2);

            // Escreve o conteúdo no arquivo JSON
            fs.writeFileSync(jsonPath, updatedJsonContent, 'utf-8');

            console.log(`Segmento "${segmentName}" adicionado com sucesso com a URL "${url}" para o JSON ${jsonPath}.`);
        } catch (error) {
            console.error('Erro ao adicionar segmento:', error);
        }
    }

    async getParentFolder(filePath) {
        const absolutePath = path.resolve(filePath); // Resolve o caminho absoluto
        return path.dirname(absolutePath); // Retorna o diretório pai
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

    public async replaceM3u8(path_id: string, live_id: string/*jsonPath: string, m3u8Path: string*/): Promise<void> {



        try {
            const jsonPath = PATH_STREAMS_OUTPUT + path_id + "/" + this.segmentsFileName
            const m3u8Path = PATH_STREAMS_OUTPUT + path_id + "/playlist.m3u8"
            const m3u8PathOut = PATH_STREAMS_OUTPUT + path_id + "/main.m3u8"
            const path_name = PATH_STREAMS_OUTPUT + path_id
            //const last_path = await this.getLastFolder(m3u8Path)

            const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
            if (!jsonContent) {
                throw new Error('JSON file is empty');
            }
            const jsonData = JSON.parse(jsonContent);

            // Read M3U8 file content
            const m3u8Content = fs.readFileSync(m3u8Path, 'utf-8');
            if (!m3u8Content) {
                throw new Error('M3U8 file is empty');
            }

            //============================

            if (!jsonData || typeof jsonData !== 'object') {
                throw new Error('Invalid jsonData: Must be a non-null object');
            }
            if (!jsonData.segments || !Array.isArray(jsonData.segments)) {
                throw new Error('Invalid jsonData: Missing or invalid "segments" array');
            }
            if (!m3u8Content || typeof m3u8Content !== 'string') {
                throw new Error('Invalid m3u8Content: Must be a non-empty string');
            }

            // Create a map of segment names to URLs
            const segmentMap = jsonData.segments.reduce((map, segment) => {
                const segmentName = Object.keys(segment)[0];
                map[segmentName] = segment[segmentName];
                return map;
            }, {});

            // Replace segment names with corresponding URLs
            /*let updatedM3U8 = m3u8Content;
            Object.keys(segmentMap).forEach(segmentName => {
                const regex = new RegExp(`${segmentName}\\.ts`, 'g');
                updatedM3U8 = updatedM3U8.replace(regex, segmentMap[segmentName]);
            });*/

            const lines = m3u8Content.split('\n');
            const updatedLines = lines.map(line => {
                // Ignorar linhas que não são nomes de segmentos
                if (!line.endsWith('.ts')) {
                    return line;
                }

                // Verificar se o segmento existe no mapa
                const segmentName = line.trim();
                if (segmentMap[segmentName]) {
                    return segmentMap[segmentName];
                }

                return line; // Manter linha original se não houver correspondência
            });

            fs.writeFileSync(m3u8PathOut, updatedLines.join('\n'));

            /*this.AwaitForFile(m3u8PathOut, async () => {
                
                await new Promise(resolve => setTimeout(resolve, 4000));
                await this._thumbnailService.createThumbnailM3U8(m3u8PathOut,
                    `${path_name}/${path_id}}.jpg`,
                    live_id
                )

                //await this.uploadM3U8(m3u8PathOut, live_id)
            })*/


            //await this.uploadM3U8(m3u8Path, live_id)




            console.log('URLs atualizadas com sucesso!');
        } catch (error) {
            console.error('Erro ao mapear os segmentos:', error);
        }
    }

    public async replaceM3u8Thumb(path_id: string, live_id: string/*jsonPath: string, m3u8Path: string*/): Promise<void> {



        try {
            const jsonPath = PATH_STREAMS_OUTPUT + path_id + "/" + this.segmentsFileName
            const m3u8Path = PATH_STREAMS_OUTPUT + path_id + "/playlist.m3u8"
            const m3u8PathOut = PATH_STREAMS_OUTPUT + path_id + "/thumb.m3u8"
            const path_name = PATH_STREAMS_OUTPUT + path_id
            //const last_path = await this.getLastFolder(m3u8Path)

            const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
            if (!jsonContent) {
                throw new Error('JSON file is empty');
            }
            const jsonData = JSON.parse(jsonContent);

            // Read M3U8 file content
            const m3u8Content = fs.readFileSync(m3u8Path, 'utf-8');
            if (!m3u8Content) {
                throw new Error('M3U8 file is empty');
            }

            //============================

            if (!jsonData || typeof jsonData !== 'object') {
                throw new Error('Invalid jsonData: Must be a non-null object');
            }
            if (!jsonData.segments || !Array.isArray(jsonData.segments)) {
                throw new Error('Invalid jsonData: Missing or invalid "segments" array');
            }
            if (!m3u8Content || typeof m3u8Content !== 'string') {
                throw new Error('Invalid m3u8Content: Must be a non-empty string');
            }

            // Create a map of segment names to URLs
            const segmentMap = jsonData.segments.reduce((map, segment) => {
                const segmentName = Object.keys(segment)[0];
                map[segmentName] = segment[segmentName];
                return map;
            }, {});

            // Replace segment names with corresponding URLs
            /*let updatedM3U8 = m3u8Content;
            Object.keys(segmentMap).forEach(segmentName => {
                const regex = new RegExp(`${segmentName}\\.ts`, 'g');
                updatedM3U8 = updatedM3U8.replace(regex, segmentMap[segmentName]);
            });*/

            const lines = m3u8Content.split('\n');
            const updatedLines = lines.map(line => {
                // Ignorar linhas que não são nomes de segmentos
                if (!line.endsWith('.ts')) {
                    return line;
                }

                // Verificar se o segmento existe no mapa
                const segmentName = line.trim();
                if (segmentMap[segmentName]) {
                    //return segmentMap[segmentName];
                    return `${config.PROXY_BUNNY}?url=${segmentMap[segmentName]}`
                }

                return line; // Manter linha original se não houver correspondência
            });

            fs.writeFileSync(m3u8PathOut, updatedLines.join('\n'));

            this.AwaitForFile(m3u8PathOut, async () => {

                await new Promise(resolve => setTimeout(resolve, 4000));
                await this._thumbnailService.createThumbnailM3U8(m3u8PathOut,
                    `${path_name}/${path_id}}.jpg`,
                    live_id
                )

                //await this.uploadM3U8(m3u8PathOut, live_id)
            })
            console.log('URLs atualizadas com sucesso!');
        } catch (error) {
            console.error('Erro ao mapear os segmentos:', error);
        }
    }

    async AwaitForFile(
        filePath: string,
        callback: () => void | Promise<void>,
        interval: number = 1000,
        timeout: number = 30000
    ): Promise<void> {
        const absolutePath = path.resolve(filePath);
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const checkFile = async () => {
                try {
                    // Verifica se o arquivo existe
                    await fs.promises.access(absolutePath, fs.constants.F_OK);

                    // Executa o callback
                    await callback();
                    resolve();
                } catch (error) {
                    // Se o arquivo não existe, verifica o tempo de timeout
                    if (Date.now() - startTime >= timeout) {
                        reject(new Error(`Timeout: O arquivo "${absolutePath}" não foi encontrado após ${timeout}ms.`));
                        return;
                    }

                    // Agenda a próxima verificação
                    setTimeout(checkFile, interval);
                }
            };

            // Inicia a primeira verificação
            checkFile();
        });
    }

    async updateStreamUrl(url_complete: string, live_id: string): Promise<any> {
        /*const streamService: LiveService = new LiveService;
        const json = await this.readFileResponseUploadStream(jsonFileName, food_url)
        const url = json.files.url
     
        await streamService.updateStreamUrls(streamId, url)*/

        const liveService: LiveService = new LiveService;

        return await liveService.updateStreamUrls(url_complete/*, streamer, platform*/, live_id)
    }

    async updateClipUrl(url_complete: string, clip_id: string): Promise<any> {
        /*const streamService: LiveService = new LiveService;
        const json = await this.readFileResponseUploadStream(jsonFileName, food_url)
        const url = json.files.url
     
        await streamService.updateStreamUrls(streamId, url)*/

        const clipService: ClipService = new ClipService;

        return await clipService.updateStreamUrls(url_complete/*, streamer, platform*/, clip_id)
    }
}

// Substitua com suas informações

//userImageUploader(urlImagem, token, urlUpload);
