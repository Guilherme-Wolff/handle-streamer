import * as fs from 'fs/promises';
import * as fs_sync from 'node:fs';
import { spawn } from "child_process";
import { HTML_USERS_PATH, PROXIES_PATH } from "../../../../root_path.js"
import * as cheerio from 'cheerio';
import * as path from 'path';

//import * as path from 'path';

interface streamerExist {
    exist: boolean;
    url: string;
}

interface IProxyConfig {
    ip: string,
    port: string,
    country: string,
    city: string,
    speed: string,
    type: string,
    anonymity: string
}

//let current_proxies: IProxyConfig[] = [];

export class FileUtilities {

    constructor() { }

    public current_proxies: IProxyConfig[] = [];

    public file_name_proxies: string = 'freeproxies'


    async getProxiesHtmls(name: string = this.file_name_proxies, type: string = 'http', page_number: number | string = '1'): Promise<any> {

        const getHtmlWithProxies = `https://www.freeproxy.world/?type=${type}&anonymity=&country=&speed=&port=&page=${page_number}`;

        try {
            const user_html = name + '.html';
            const CURL_ARGS = ['-X', 'GET', getHtmlWithProxies];

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
            const proxies = await this.extractProxies(responseHTML);
            //await this.deleteFile(HTML_USERS_PATH + user_html);
            return await proxies;
        } catch (error) {
            throw new Error((error as Error).message);
        }
    }

    async listProxies(): Promise<any> {
        this.current_proxies.map((proxie: IProxyConfig) => {
            console.log(" >> PROXIE << :", proxie)
        })
    }

    async extractProxies(html_text: string): Promise<any[]> {
        const $ = cheerio.load(html_text);
        let listProxies: IProxyConfig[] = [];

        $('tr').each((index, element) => {
            const ip = $(element).find('td.show-ip-div').text().trim();
            const port = $(element).find('td a[href^="/?port="]').text().trim();
            const country = $(element).find('td .table-country').text().trim();
            const city = $(element).find('td:nth-child(4)').text().trim();
            const speed = $(element).find('td a[href^="/?speed="]').text().trim();
            const type = $(element).find('td a[href^="/?type="]').text().trim();
            const anonymity = $(element).find('td a[href^="/?anonymity="]').text().trim();

            if (ip && port) {
                listProxies.push({
                    ip,
                    port,
                    country,
                    city,
                    speed,
                    type,
                    anonymity
                } as IProxyConfig)
            }
        });

        try {
            const proxies = { proxies: [...listProxies] }
            const jsonContent = JSON.stringify(proxies, null, 2)
            const filePath = PROXIES_PATH + this.file_name_proxies + '.json';
            
            await fs.mkdir(PROXIES_PATH, { recursive: true });

            await fs.writeFile(filePath, jsonContent, 'utf8');
            console.log(`Proxies salvos com sucesso em ${filePath}`);

            const PROXIES_JSON = JSON.parse(await this.readFileJson(this.file_name_proxies))
            if (PROXIES_JSON) {
                PROXIES_JSON.proxies.map((p) => {
                    console.log("É UM ARRAY", p)
                })
            }
        } catch (error) {
            console.error('Erro ao salvar o arquivo JSON:', error);
        }
        return listProxies;
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
    async readFileJson(fileName: string): Promise<any> {
        try {
            const filePath = PROXIES_PATH + fileName + '.json';
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