import * as fs from 'node:fs';
import { spawn } from "child_process";
import { PATH_RESPONSE_UPLOADS, PATH_STREAMS_THUMBNAILS, PATH_STREAMS_OUTPUT } from "../../../../root_path.js"
import { LiveService } from "../services/lives.service.js"
import { StreamersService } from "../services/streamers.service.js"
//import { ICreateAlbum, Pixeldrain } from "../services/pixeldrain.service.js"
//import axios from 'axios';
//import { url } from 'node:inspector';

//const ONLINE_STATUS = 2;



export interface INFOuploadService {
    token?: string;
    api_url: string;
    absolute_path_streams: string;
}




export class UploadJsonBlobService {
    public BUCKET_URL: string = '';
    public AUTH_TOKEN: string = '';
    public PIXELDRAIN_KEY: string = '813c34ef-cbb9-4189-b91a-81427a5f0381'
    public PATH_STREAMS_OUTPUT: string = PATH_STREAMS_OUTPUT;
    public PATH_STREAMS_THUMBNAILS: string = PATH_STREAMS_THUMBNAILS;
    public PATH_RESPONSE_UPLOADS: string = PATH_RESPONSE_UPLOADS;
    public BUNKER_TOKEN = '8smWG8uhfjFhEVrwn7bZ3Oa6TFenghAO7vtv7VsU3V2CSwTr1FckqvRbLAH7aDjd';

    public JASONBLOB_API = "https://jsonblob.com/api/jsonBlob";

    private TOKEN_BUNKR: string = '8smWG8uhfjFhEVrwn7bZ3Oa6TFenghAO7vtv7VsU3V2CSwTr1FckqvRbLAH7aDjd'

    public URL_FOR_GET_SERVER_BUNKRS = "https://app.bunkrr.su/api/node";

    public EXTENSION_DEFAULT = ".mp4"

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






    async uploadChat(fileName: string, live_id: string, streamer: string, platform: string): Promise<any> {

        console.log(`
            =======================================================================
            CHAT ==  CHAT == UPLOAD == CHAT == CHAT == CHAT == CHAT == CHAT == CHAT
            =======================================================================
            start upload Chat = ${this.PATH_STREAMS_OUTPUT + fileName}
            =======================================================================
            `
        )

        const json_file_name = fileName + "chat" + '.json';

        //curl -i -X "POST" -d @./ola.json -H "Content-Type: application/json" -H "Accept: application/json" https://jsonblob.com/api/jsonBlob

        let CURL_ARGS_PIXELDRAIN = [
            '-i',
            '-X', 'POST',
            '-d', `@${this.PATH_STREAMS_OUTPUT}${fileName}/${fileName}chat.json`,
            '-H', 'Content-Type:  application/json',
            '-H', 'Accept: application/json',
            this.JASONBLOB_API,
        ]

        const uploadProcess = spawn('curl', CURL_ARGS_PIXELDRAIN);

        uploadProcess.stdout.on('data', async (data) => {
            let response: string = ''
            response += data.toString(); // Concatena os pedaços da resposta
            const locationMatch = response.match(/location:\s*(.*)/i);
            console.log(`
                MATCH
                MATCH
                MATCH
                MATCH
                `,response)

            if (locationMatch) {
                const chat_url = locationMatch[1].trim();
                console.log(`
                    URL CHAT
                    URL CHAT
                    URL CHAT
                    URL CHAT
                    `,chat_url);
                    await this.updateChatUrl(live_id,chat_url)
            } else {
                console.log('Cabeçalho "Location" não encontrado na resposta.');
            }
        });
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

    async updateChatUrl(live_id: string, urlChat: string) {
        const liveService: LiveService = new LiveService()
        await liveService.updateChat(live_id, urlChat)

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