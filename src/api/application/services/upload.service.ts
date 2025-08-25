import * as fs from 'node:fs';
import { spawn } from "child_process";
import { PATH_RESPONSE_UPLOADS, PATH_STREAMS_THUMBNAILS, PATH_STREAMS_OUTPUT } from "../../../../root_path.js"
import { LiveService } from "../services/lives.service.js"
import { StreamersService } from "../services/streamers.service.js"
import { Pixeldrain } from "../services/pixeldrain.service.js"
import axios from 'axios';
//import { url } from 'node:inspector';

//const ONLINE_STATUS = 2;



export interface INFOuploadService {
    token?: string;
    api_url: string;
    absolute_path_streams: string;
}




export class uploadService {
    public BUCKET_URL: string = '';
    public AUTH_TOKEN: string = '';
    public PIXELDRAIN_KEY: string = 'f69178c6-f234-486e-a0f2-e58b92bd6b4d'
    public PATH_STREAMS_OUTPUT: string = PATH_STREAMS_OUTPUT;
    public PATH_STREAMS_THUMBNAILS: string = PATH_STREAMS_THUMBNAILS;
    public PATH_RESPONSE_UPLOADS: string = PATH_RESPONSE_UPLOADS;
    public BUNKER_TOKEN = '8smWG8uhfjFhEVrwn7bZ3Oa6TFenghAO7vtv7VsU3V2CSwTr1FckqvRbLAH7aDjd';

    public PIXELDRAIN_API = "https://pixeldrain.com/api/file";

    private TOKEN_BUNKR: string = '8smWG8uhfjFhEVrwn7bZ3Oa6TFenghAO7vtv7VsU3V2CSwTr1FckqvRbLAH7aDjd'

    public URL_FOR_GET_SERVER_BUNKRS = "https://app.bunkrr.su/api/node";

    public EXTENSION_DEFAULT = ".mp4"

    /*constructor({ token, api_url, absolute_path_streams }: INFOuploadService) {

        this.BUCKET_URL = api_url
        this.AUTH_TOKEN = token ? token : ''
        this.PATH_STREAMS_OUTPUT = absolute_path_streams
    }*/

    async getServerBunkr(): Promise<string> {
        const { data } = await axios.get(this.URL_FOR_GET_SERVER_BUNKRS, {
            headers: {
                token: this.TOKEN_BUNKR
            }
        })
        if (data.success) {
            return data.url
        }
        else {
            return ''
        }
    }


    /*async isUrlThumbnail(url: string): Promise<boolean> {
        return url.includes(".jpg");
    }

    async isUrlStream(url: string): Promise<boolean> {
        return url.includes(".mp4");
    }*/


    async uploadStream(fileName: string, streamer: string, platform: string): Promise<any> {

        console.log(`
            =======================================================================================
            UPLOAD ==  UPLOAD == UPLOAD == UPLOAD == UPLOAD == UPLOAD == UPLOAD == UPLOAD == UPLOAD
            =======================================================================================
            start upload streamer : ${streamer} file name = ${this.PATH_STREAMS_OUTPUT + fileName}
            =======================================================================================
            `
        )

        const json_file_name = fileName + '.json';




        let CURL_ARGS_PIXELDRAIN_DEFAULT = [
            '-X', 'PUT',
            '-H', `Authorization: Basic ${this.PIXELDRAIN_KEY}`,
            '-H', 'Cookie:' + `pd_auth_key=${this.PIXELDRAIN_KEY}`,
            //'-H', 'Content-Type: multipart/form-data',
            '-H', 'Content-Type: video/mp4',
            //'-F', 'anonymous=false',
            //'-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\nAccept-Language: en-us,en;q=0.5\nSec-Fetch-Mode: navigate',
            '--data-binary', `@${this.PATH_STREAMS_OUTPUT}${fileName}/${fileName}${this.EXTENSION_DEFAULT}`,
            `${this.PIXELDRAIN_API}/${fileName}${this.EXTENSION_DEFAULT}`,
        ]

        let CURL_ARGS_PIXELDRAIN = [
            '-X', 'PUT',
            '-H', `Authorization: Basic ${this.PIXELDRAIN_KEY}`,
            '-H', 'Cookie:' + `pd_auth_key=${this.PIXELDRAIN_KEY}`,
            //'-H', 'Content-Type: multipart/form-data',
            '--upload-file', `${this.PATH_STREAMS_OUTPUT}${fileName}/${fileName}${this.EXTENSION_DEFAULT}`,
            `${this.PIXELDRAIN_API}/${fileName}${this.EXTENSION_DEFAULT}`,
        ]

        const uploadProcess = spawn('curl', CURL_ARGS_PIXELDRAIN_DEFAULT, {
            stdio: ['inherit', 'pipe', 'pipe'] // for create response.json
        });

        /*uploadProcess.on('data', async (data) => {
            console.log('EVENT DATA : ', data)
        })*/

        uploadProcess.on('close', async (code) => {
            console.log(" --> upload concluido <--")
            // this.deleteFileStream(fileName)
            // PODE DAR ERRO COM AWAIT
            const responseJson = await this.pixeldrainReadFileResponseUploadStream(fileName, streamer, platform)



            console.log("JSON STREAM RESPONSE WITH ID ", responseJson)
            //delete json
            // savar id do stream
            //await this.deleteFileStream(fileName)

            //await this.deleteFileResponseUpload(json_gile_name)



            return await responseJson;
        })
        const outputStream = fs.createWriteStream(PATH_RESPONSE_UPLOADS + json_file_name);
        uploadProcess.stdout.pipe(outputStream);




        //return await responseJson;
    }

    async uploadChat(fileName: string, streamer: string, platform: string): Promise<any> {

        console.log(`
            =======================================================================
            CHAT ==  CHAT == UPLOAD == CHAT == CHAT == CHAT == CHAT == CHAT == CHAT
            =======================================================================
            start upload CH : ${streamer} file name = ${this.PATH_STREAMS_OUTPUT + fileName}
            =======================================================================
            `
        )

        const json_file_name = fileName + "chat" + '.json';

        let CURL_ARGS_PIXELDRAIN = [
            '-X', 'PUT',
            '-H', `Authorization: Basic ${this.PIXELDRAIN_KEY}`,
            '-H', 'Cookie:' + `pd_auth_key=${this.PIXELDRAIN_KEY}`,
            '-H', 'Content-Type:  application/json',
            //'-H', 'Content-Type: multipart/form-data',
            '--data-binary', `@${this.PATH_STREAMS_OUTPUT}${fileName}/${fileName}`,
            `${this.PIXELDRAIN_API}/${fileName}`,
        ]

        const uploadProcess = spawn('curl', CURL_ARGS_PIXELDRAIN, {
            stdio: ['inherit', 'pipe', 'pipe'] // for create response.json
        });

        /*uploadProcess.on('data', async (data) => {
            console.log('EVENT DATA : ', data)
        })*/

        uploadProcess.on('close', async (code) => {
            console.log(" --> upload concluido <--")
            // this.deleteFileStream(fileName)
            // PODE DAR ERRO COM AWAIT
            const responseJson = await this.pixeldrainReadFileResponseUploadChat(json_file_name, streamer, platform)

            console.log("JSON CHAT RESPONSE WITH ID ", responseJson)
            //delete json
            // savar id do stream
            //await this.deleteFileStream(fileName)

            //await this.deleteFileResponseUpload(json_gile_name)



            return await responseJson;
        })
        const outputStream = fs.createWriteStream(PATH_RESPONSE_UPLOADS + json_file_name);

        uploadProcess.stdout.pipe(outputStream);




        //return await responseJson;
    }


    async getFileNameInPath(filePath: string) {
        const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
        // Extrai o nome do arquivo a partir dessa posição
        return filePath.substring(lastSlashIndex + 1);
    };




    async getFileJsonResponseUpload(path: string): Promise<any> {

        return await true
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

    async pixeldrainReadFileResponseUploadStream(fileName: string, streamer: string, platform: string = 'tiktok'): Promise<any> {
        console.log("PEGANDO JSON: ", fileName + '.json')
        let jsonData: any = '';
        fs.readFile(PATH_RESPONSE_UPLOADS + fileName + '.json', 'utf8', async (err, data: any) => {
            if (err) {
                console.error(`Erro read file: ${err.message}`);
                return;
            }

            try {

                const StreamerService: StreamersService = new StreamersService;

                jsonData = await JSON.parse(data);
                console.log("JSON DATA: ", jsonData)
                //const name_file: string = jsonData.files[0];
                const file_id = jsonData.id;
                console.log("STREAM PIXELDRAIN ID :", file_id)

                /*const albumDataWithId = {
                    "title": streamer,//uuid
                    "anonymous": false,
                    "files": [
                        {
                            "id": file_id,//id do arquivo que quer cololarr no album
                            "description": ""
                        },
                    ]
                };*/

                //CONSERTAR ALBUM ADD
                /* const StreamerService: StreamersService = new StreamersService;
                 const pixeldrain = new Pixeldrain();
 
                 const album_id = await pixeldrain.createAlbum(albumDataWithId)*/




                await this.updateStreamUrl(file_id, streamer, platform)

                await StreamerService.addAlbumID(streamer, file_id, platform)

                return await jsonData;

            } catch (error) {
                console.error(`Erro ao analisar o JSON STREAM: ${error}`);
            }
        });
        return await jsonData;
    }


    async pixeldrainReadFileResponseUploadChat(fileName: string, streamer: string, platform: string = 'tiktok'): Promise<any> {
        console.log("PEGANDO JSON: ", fileName)
        let jsonData: any = '';
        fs.readFile(PATH_RESPONSE_UPLOADS + fileName, 'utf8', async (err, data: any) => {
            if (err) {
                console.error(`Erro read file: ${err.message}`);
                return;
            }

            try {
                jsonData = await JSON.parse(data);
                console.log("JSON DATA: ", jsonData)
                //const name_file: string = jsonData.files[0];
                const id = jsonData.id;
                console.log("CHAT PIXELDRAIN ID:", id)

                const update = await this.updateStreamUrl(id, streamer, platform)
                return await jsonData;

            } catch (error) {
                console.error(`Erro ao analisar o JSON Chat: ${error}`);
            }
        });
        return await jsonData;
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

    async updateStreamUrl(url_complete: string, streamer: string, platform: string): Promise<any> {
        /*const streamService: LiveService = new LiveService;
        const json = await this.readFileResponseUploadStream(jsonFileName, food_url)
        const url = json.files.url

        await streamService.updateStreamUrls(streamId, url)*/

        const liveService: LiveService = new LiveService;

        return await liveService.updateStreamUrls(url_complete, platform)
    }

    async updateThumbnail(url_complete: string, streamer: string, platform: string): Promise<any> {
        /*const streamService: LiveService = new LiveService;
        const json = await this.readFileResponseUploadStream(jsonFileName, food_url)
        const url = json.files.url

        await streamService.updateStreamUrls(streamId, url)*/

        const liveService: LiveService = new LiveService;

        return await liveService.updateThumbnail(url_complete, streamer, platform)
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