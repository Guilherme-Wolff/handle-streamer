import * as fs from 'fs/promises';
import * as fs_sync from 'node:fs';
import { spawn } from "child_process";
import { HTML_USERS_PATH } from "../../../../root_path.js"
import { Streamers } from "../../domain/entities/streamers.entity.js"
import * as cheerio from 'cheerio';

import * as path from 'path';

interface streamerExist {
    exist: boolean;
    url: string;
}


export class FileUtilities {


    async streamerExistInTiktok(name: string, plataform: string = 'tiktok'): Promise<streamerExist> {
        const user_url = `https://www.tiktok.com/@${name}`;
        let existInTiktok: streamerExist = {
            exist: false,
            url: ''
        };

        try {
            const user_html = name + '.html';
            const CURL_ARGS = ['-X', 'GET', user_url];

            const curlProcess = spawn('curl', CURL_ARGS, {
                stdio: ['inherit', 'pipe', 'pipe']
            });

            const outputStream = fs_sync.createWriteStream(HTML_USERS_PATH + user_html);
            curlProcess.stdout.pipe(outputStream);

            await new Promise<void>((resolve, reject) => {
                curlProcess.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Failed to fetch HTML. Exit code: ${code}`));
                    }
                });
            });

            const responseHTML = await this.readFileHTML(name);
            const url = await this.extractAvatar(responseHTML);
            const URL_IMG_FIXED = await this.fix_url(url);

            existInTiktok.exist = true;
            existInTiktok.url = URL_IMG_FIXED.toString();

            // Excluir o arquivo HTML se necessário
            await this.deleteFile(HTML_USERS_PATH + user_html);

            return await existInTiktok;
        } catch (error) {
            console.log("error FileUtilities")
            throw new Error((error as Error).message);
        }
    }

    /*async streamerExistInTiktok(name: string, plataform: string = 'tiktok'): Promise<streamerExist> {

        const user_url = `https://www.tiktok.com/@${name}`;
        let existInTiktok: streamerExist = {
            exist: false,
            url: ''
        }

        let URL_IMG = '';
        try {
            //const streamer: Streamers = new Streamers(name, plataform)
            const user_html = name + '.html';
            let CURL_ARGS = [
                '-X', 'GET',
                user_url,
                //'-o', `${name}.html`
            ]

            const curlProcess = await spawn('curl', CURL_ARGS, {
                stdio: ['inherit', 'pipe', 'pipe'] // for create response.html
            });

            curlProcess.on('close', async (code) => {
                // this.deleteFileStream(fileName)
                const responseHTML = await this.readFileHTML(name)

                let url = await this.extractAvatar(responseHTML)
                const URL_IMG_FIXED = await this.fix_url(url)
                console.log("URL : ", URL_IMG_FIXED)

                existInTiktok.exist = true
                existInTiktok.url = URL_IMG_FIXED.toString()

                return await existInTiktok;

                //await this.deleteFile(HTML_USERS_PATH + user_html)
                //return await URL_IMG;
            })
            const outputStream = await fs_sync.createWriteStream(HTML_USERS_PATH + user_html);
            await curlProcess.stdout.pipe(outputStream);


            return await existInTiktok;

        } catch (error) {
            throw new Error((error as Error).message)
        }
    }*/


    async extractAvatar(html_text: string, plataform: string = 'tiktok'): Promise<any> {
        const $ = await cheerio.load(html_text);
        const avatarThumb = await $('body').text().match(/"avatarThumb"\s*:\s*"(.*?)"/);

        if (avatarThumb && avatarThumb[1]) {
            return await avatarThumb[1];
        } else {
            return await null;
        }
    }

    async fix_url(url: string): Promise<any> {
        const urlCorrigida = await url.replace(/\\u002F/g, '/');
        return await urlCorrigida;
    }

    async getStreamer(name: string, plataform: string): Promise<any> {

        try {
            const streamer: Streamers = new Streamers(name, plataform)

        } catch (error) {
            throw new Error((error as Error).message)
        }
    }

    async readFileHTML(fileName: string): Promise<any> {
        try {
            const filePath = HTML_USERS_PATH + fileName + '.html';
            const data = await fs.readFile(filePath, 'utf8');
            return data;
        } catch (error: any) {
            console.error(`Erro ao ler o arquivo: ${error.message}`);
            throw new Error(error.message);
        }
    }
    async deleteFile(filePath: string) {
        try {
            await fs.unlink(filePath);
        } catch (error: any) {
            // throw new Error(error.message);
            return
        }
    }
}