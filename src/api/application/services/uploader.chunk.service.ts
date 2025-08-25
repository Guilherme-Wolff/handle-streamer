import * as fs from 'node:fs';
import { rm, unlink } from 'fs/promises';
import { spawn } from "child_process";
import { PATH_RESPONSE_UPLOADS, PATH_STREAMS_THUMBNAILS, PATH_STREAMS_OUTPUT, } from "../../../../root_path.js"
import { LiveService } from "../services/lives.service.js"
import { StreamersService } from "../services/streamers.service.js"

import { Process, ProcessStart, SegmentMap, Segment } from "../../infrastructure/processManager/interfaces.js"
import { ThumbnailService } from '../../application/services/thumbnail.service.js';

import { config } from "../config/index.js"
import * as path from 'path';
import { CONNREFUSED } from 'node:dns';
//import { ICreateAlbum, Pixeldrain } from "../services/pixeldrain.service.js"
//import axios from 'axios';
//import { url } from 'node:inspector';

//const ONLINE_STATUS = 2;



export interface INFOuploadService {
    token?: string;
    api_url: string;
    absolute_path_streams: string;
}




export class UploadChunkService {
    public BUCKET_URL: string = '';
    public AUTH_TOKEN: string = '';
    public PIXELDRAIN_KEY: string = config.PIXELDRAIN_KEY;
    public PATH_STREAMS_OUTPUT: string = PATH_STREAMS_OUTPUT;
    public PATH_STREAMS_THUMBNAILS: string = PATH_STREAMS_THUMBNAILS;
    public PATH_RESPONSE_UPLOADS: string = PATH_RESPONSE_UPLOADS;
    public segmentsFileName: string = "segments.json"

    public _thumbnailService: ThumbnailService = new ThumbnailService;

    //public API = "https://pomf.lain.la/upload.php";
    public API = "https://catbox.moe/user/api.php";
    //public APIuguu = "https://uguu.se/upload"


    public EXTENSION_DEFAULT = ".ts"

    //public pixeldrain = new Pixeldrain();

    /*constructor({ token, api_url, absolute_path_streams }: INFOuploadService) {

        this.BUCKET_URL = api_url
        this.AUTH_TOKEN = token ? token : ''
        this.PATH_STREAMS_OUTPUT = absolute_path_streams
    }*/



    /*async isUrlThumbnail(url: string): Promise<boolean> {
        return url.includes(".jpg");
    }

    async isUrlStream(url: string): Promise<boolean> {
        return url.includes(".mp4");
    }*/


    async uploadChunk(file: string, fileName: string): Promise<any> {

        console.log(`
            =======================================================================================
            UPLOAD ==  UPLOAD == UPLOAD == UPLOAD == UPLOAD == UPLOAD == UPLOAD == UPLOAD == UPLOAD
            =======================================================================================
            FILE NAME CHUNK : ${fileName} FILE NAME : ${fileName} FILE NAME : ${fileName} 
            FILE  : ${file} FILE : ${file} FILE : ${file} 
            =======================================================================================
            `
        )
        const path_name = await this.getParentFolder(file)


        //const json_file_name = fileName + '.json';
        const json_file_name = file + '.json';




        let CURL_ARGS_PIXELDRAIN_DEFAULT = [
            '-X', 'POST',
            '-F', 'reqtype=fileupload',
            '-F', `fileToUpload=@${file}`,
            '-F', 'userhash=d6bc4d28ec33604f05085baa4',
            `${this.API}`,
        ]

        const uploadProcess = spawn('curl', CURL_ARGS_PIXELDRAIN_DEFAULT, {
            //stdio: ['inherit', 'pipe', 'pipe'] // for create response.json
        });


        uploadProcess.stdout.on('data', async (data) => {
            let url: string = ''
            url += data.toString(); // Concatena os pedaços da resposta
            //const locationMatch = response.match(/location:\s*(.*)/i);
            console.log(`
                MATCH
                MATCH
                MATCH
                MATCH
                `, url)
            if (url) {
                await this.addSegmentinJson(path_name + "/" + this.segmentsFileName, fileName, url)

                //await StreamerService.addAlbumID(streamer, file_id, platform)

                await this.deleteSpecificFile(file)

            }

            /*if (locationMatch) {
                const chat_url = locationMatch[1].trim();
                console.log(`
                    URL CHAT
                    URL CHAT
                    URL CHAT
                    URL CHAT
                    `,chat_url);
                    //await this.updateChatUrl(live_id,chat_url)
            } else {
                console.log('Cabeçalho "Location" não encontrado na resposta.');
            }*/
        });

        /*uploadProcess.on('data', async (data) => {
            console.log('EVENT DATA : ', data)
        })*/

        uploadProcess.on('close', async (code) => {
            console.log(" --> upload concluido <--")

            //const responseJson = await this.ReadFileResponseUploadChunk(json_file_name)
            //this.uploadM3U8(path_name+"/"+"playlist.m3u8")

            //return await responseJson;
        })
        //const outputStream = fs.createWriteStream(/*PATH_RESPONSE_UPLOADS + */json_file_name);
        //uploadProcess.stdout.pipe(outputStream);




        //return await responseJson;
    }

    async uploadM3U8(m3u8_path, live_id: string): Promise<any> {

        //const path_m3u8 = PATH_STREAMS_OUTPUT + path_id + "/" + "playlist.m3u8"

        const json_file_name = m3u8_path + '.json';

        //const json_file_name = PATH_STREAMS_OUTPUT + path_id + "/" + path_id + '.json';




        let CURL_ARGS_PIXELDRAIN_DEFAULT = [
            '-X', 'POST',
            '-F', 'reqtype=fileupload',
            '-F', `fileToUpload=@${m3u8_path}`,
            '-F', 'userhash=d6bc4d28ec33604f05085baa4',
            `${this.API}`,
        ]

        const uploadProcess = spawn('curl', CURL_ARGS_PIXELDRAIN_DEFAULT, {
            stdio: ['inherit', 'pipe', 'pipe'] // for create response.json
        });

        /*uploadProcess.on('data', async (data) => {
            console.log('EVENT DATA : ', data)
        })*/
        uploadProcess.stdout.on('data', async (data) => {
            let url: string = ''
            url += data.toString(); // Concatena os pedaços da resposta
            //const locationMatch = response.match(/location:\s*(.*)/i);
            console.log(`
                    MATCH
                    MATCH
                    MATCH
                    MATCH
                    `, url)
            if (url) {
                await this.updateStreamUrl(url, live_id)
                //await StreamerService.addAlbumID(streamer, file_id, platform)

                //await this.deleteSpecificFile(m3u8_path)

            }
        });


        uploadProcess.on('close', async (code) => {
            console.log(" --> upload concluido <--")
            // this.deleteFileStream(fileName)
            // PODE DAR ERRO COM AWAIT
            //const responseJson = await this.ReadFileResponseUploadM3U8(json_file_name, live_id)



            //console.log("RESPOSTA CHUNK ", responseJson)

            //return await responseJson;
        })
        //const outputStream = fs.createWriteStream(/*PATH_RESPONSE_UPLOADS + */json_file_name);
        // uploadProcess.stdout.pipe(outputStream);
    }

    async deleteFileStream(name: string): Promise<any> {
        console.log("deletando stream")
        fs.unlink(this.PATH_STREAMS_OUTPUT + name, (err) => {
            if (err) {
                console.error('Erro ao deletar o arquivo:', err);
            } else {
                console.log('Arquivo deletado com sucesso!');
            }
        });

    }

    async ReadFileResponseUploadChunk(file: string): Promise<any> {
        console.log("PEGANDO JSON: ", file + '.json')
        let jsonData: any = '';
        fs.readFile(/*PATH_RESPONSE_UPLOADS +*/ file/* + '.json'*/, 'utf8', async (err, data: any) => {
            if (err) {
                console.error(`Erro read file: ${err.message}`);
                return;
            }

            try {
                const path_name = await this.getParentFolder(file)
                //const StreamerService: StreamersService = new StreamersService;

                jsonData = await JSON.parse(data);
                console.log("JSON DATA: ", jsonData)
                //const name_file: string = jsonData.files[0];
                //const file_id = jsonData.id;
                if (jsonData) {
                    const url = jsonData.files[0].url
                    const url_normalized = await this.normalizeSlashes(url)
                    const fileName = path.basename(file);

                    await this.addSegmentinJson(path_name + "/" + this.segmentsFileName, fileName, url_normalized)

                    //await StreamerService.addAlbumID(streamer, file_id, platform)

                    await this.deleteSpecificFile(file)
                }

                return await jsonData;

            } catch (error) {
                console.error(`Erro ao analisar o JSON STREAM: ${error}`);
            }
        });
        return await jsonData;
    }

    async ReadFileResponseUploadM3U8(file: string, live_id: string): Promise<any> {
        console.log("PEGANDO JSON: ", file + '.json')
        let jsonData: any = '';
        fs.readFile(/*PATH_RESPONSE_UPLOADS +*/ file/* + '.json'*/, 'utf8', async (err, data: any) => {
            if (err) {
                console.error(`Erro read file: ${err.message}`);
                return;
            }

            try {
                //const StreamerService: StreamersService = new StreamersService;

                jsonData = await JSON.parse(data);
                console.log("JSON DATA: ", jsonData)
                //const name_file: string = jsonData.files[0];
                //const file_id = jsonData.id;
                if (jsonData) {
                    const url = jsonData.files[0].url
                    const url_normalized = await this.normalizeSlashes(url)
                    const fileName = path.basename(file);

                    await this.updateStreamUrl(url_normalized, live_id)

                    //await this.addSegmentinJson(path_name + "/" + this.segmentsFileName, fileName, url_normalized)

                    //await StreamerService.addAlbumID(streamer, file_id, platform)

                    await this.deleteSpecificFile(file)
                }

                return await jsonData;

            } catch (error) {
                console.error(`Erro ao analisar o JSON STREAM: ${error}`);
            }
        });
        return await jsonData;
    }

    /**
 * Transforms filenames like segment_XXXX.ts.json to segment_XXXX
 * @param {string} filename - The input filename (e.g., segment_0000.ts.json)
 * @returns {string} - The transformed filename (e.g., segment_0000)
 */
    async transformSegmentFilename(filename: string) {
        if (!filename || typeof filename !== 'string') {
            throw new Error('Filename must be a non-empty string');
        }

        // Extract the basename without path
        const basename = filename

        // Remove .ts.json or .json extensions, preserving the core name
        return basename
            .replace(/\.ts\.json$/, '') // Handles segment_XXXX.ts.json
            .replace(/\.json$/, '');   // Handles segment_XXXX.json
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
            const seg = await await this.transformSegmentFilename(segmentName)
            // Adiciona o novo segmento ao array de segmentos
            jsonSegments.push({ [seg]: url });

            // Cria o conteúdo atualizado do JSON
            const updatedJsonContent = JSON.stringify({ segments: jsonSegments }, null, 2);

            // Escreve o conteúdo no arquivo JSON
            fs.writeFileSync(jsonPath, updatedJsonContent, 'utf-8');

            console.log(`Segmento "${segmentName}" adicionado com sucesso com a URL "${url}" para o JSON ${jsonPath}.`);
        } catch (error) {
            console.error('Erro ao adicionar segmento:', error);
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

            this.AwaitForFile(m3u8PathOut, async () => {

                await this._thumbnailService.createThumbnailM3U8(m3u8PathOut,
                    `${path_name}/${path_id}}.jpg`,
                    live_id
                )

                //await this.uploadM3U8(m3u8PathOut, live_id)
            })


            //await this.uploadM3U8(m3u8Path, live_id)




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



    async deleteFileResponseUpload(name: string): Promise<any> {
        console.log("deletando json upload :", name)
        fs.unlink(PATH_RESPONSE_UPLOADS + name, (err) => {
            if (err) {
                console.error('Erro ao deletar o arquivo:', err);
            } else {
                console.log('Arquivo deletado com sucesso!');
            }
        });
    }

    async updateStreamUrl(url_complete: string, live_id: string): Promise<any> {
        /*const streamService: LiveService = new LiveService;
        const json = await this.readFileResponseUploadStream(jsonFileName, food_url)
        const url = json.files.url

        await streamService.updateStreamUrls(streamId, url)*/

        const liveService: LiveService = new LiveService;

        return await liveService.updateStreamUrls(url_complete, live_id)
    }


    async updateThumbnail(url_complete: string, streamer: string, platform: string): Promise<any> {
        /*const streamService: LiveService = new LiveService;
        const json = await this.readFileResponseUploadStream(jsonFileName, food_url)
        const url = json.files.url

        await streamService.updateStreamUrls(streamId, url)*/

        const liveService: LiveService = new LiveService;

        return await liveService.updateThumbnail(url_complete, streamer, platform)
    }

    async normalizeSlashes(url: string) {
        return url.replace(/\\+/g, '/');
    }

    /**
* Delete a folder and all its contents.
* @param {string} path - Path of the folder to be deleted.
*/
    async deleteFolderRecursive(path) {
        try {
            await rm(path, { recursive: true, force: true });
            console.log(`Pasta "${path}" deletada com sucesso.`);
        } catch (error) {
            console.error(`Erro ao deletar a pasta "${path}":`, error);
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

    async getParentFolder(filePath) {
        const absolutePath = path.resolve(filePath); // Resolve o caminho absoluto
        return path.dirname(absolutePath); // Retorna o diretório pai
    }

    async getLastFolder(filePath) {
        const dir = path.dirname(filePath);
        return path.basename(dir);
    }




    /*createThumbnail(out_name: string): Promise<void> {
        const out = out_name + '.jpg';
        const CURL_ARGS = [
            '-i', this.PATH_STREAMS_OUTPUT + out_name + '.mp4',
            '-ss', '00:00:05',
            '-frames:v', '1',
            `${this.PATH_STREAMS_THUMBNAILS}${out_name}.jpg`
        ];

        const uploadProcess = spawn('ffmpeg', CURL_ARGS, {
            stdio: ['inherit', 'pipe', 'pipe'] // for create response.json
        });

        return new Promise<void>((resolve, reject) => {
            uploadProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(" --> Thumb criada <--");
                    //this.uploadThambnail(out_name)
                    resolve();
                } else {
                    reject(new Error(`Erro ao criar miniatura. Código de saída: ${code}`));
                }
            });

            uploadProcess.on('error', (err) => {
                reject(err);
            });
        });

    }*/

}

//export const uploadServiceInstance = new uploadService();