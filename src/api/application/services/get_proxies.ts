import * as fs from 'fs/promises';
import * as fs_sync from 'node:fs';
import fsPromises from 'fs/promises';
import * as path from 'path';
import { spawn } from "child_process";
//import http = require("http")

import * as cheerio from 'cheerio';
import { ProxyAgentOptions } from 'proxy-agent';

import { HTML_USERS_PATH } from '../../../../root_path.js'

//const HTML_USERS_PATH = 'C:/Users/gabri/Documents/projects/savelive/tiktok_chat/'

//import * as path from 'path';

export interface ProxiesList {
    proxies: IProxySimple[]
}

interface streamerExist {
    exist: boolean;
    url: string;
}

const proxyConfig: ProxyAgentOptions = {
    protocol: 'https',//protocolor importante
    host: 'host',
    port: 80,
    auth: 'false'
};


export interface IProxyConfig {
    index?: number;
    in_use?: boolean;
    ip: string,
    port: string,
    country?: string,
    city?: string,
    speed?: string,
    type: string,
    anonymity?: string
}

export interface IProxySimple {
    host: string,
    port: string,
    protocol: string,
    index: number,
    in_use: boolean
}



/*export const getProxies = async (fileName: string = 'freeproxies'): Promise<any> => {
    try {
        const filePath = HTML_USERS_PATH + fileName + '.json';
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error: any) {
        console.error(`Erro ao ler o arquivo: ${error.message}`);
        throw new Error(error.message);
    }
}*/



export class ProxiesManager {

    constructor() { }

    public current_proxies: IProxySimple[] = [];
    public file_name_proxies: string = 'freeproxies'

    async checkFileExists(filePath: string): Promise<boolean> {
        try {
            await fsPromises.access(filePath);
            return true; // O arquivo existe
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return false; // O arquivo não existe
            }
            throw error; // Lança erro se for outro tipo de erro
        }
    }

    async getProxies(fileName: string = 'freeproxies'): Promise<any> {
        try {

            if (this.current_proxies.length > 0) {
                return this.current_proxies;
            }

            const filePath = HTML_USERS_PATH + fileName + '.json';
            const exist = await this.checkFileExists(filePath)



            if (exist) {
                console.log("the proxies are already configured")
                const data = await fs.readFile(filePath, 'utf8');
                return JSON.parse(data) as ProxiesList;
            }
            else {
                await this.getProxiesHtmls()
                const exist = await this.checkFileExists(filePath)



                if (exist) {
                    console.log("the proxies are already configured")
                    const data = await fs.readFile(filePath, 'utf8');
                    return JSON.parse(data) as ProxiesList;
                }
            }

        } catch (error: any) {
            console.error(`Erro ao ler o arquivo: ${error.message}`);
            throw new Error(error.message);
        }
    }

    public selectProxy(index: number): IProxySimple | null {
        // Verifica se o índice está dentro do intervalo
        if (index < 0 || index >= this.current_proxies.length) {
            console.error("Índice fora do intervalo.");
            return null; // Retorna null se o índice for inválido
        }

        console.log(`
            RETORNANDO 
            SELECT PROXY: ${this.current_proxies[index]}
            `)

        // Retorna o proxy correspondente ao índice
        return this.current_proxies[index];
    }



    async getProxiesHtmls(name: string = this.file_name_proxies, type: string = 'http', page_number: number | string = '1'): Promise<any> {

        //FAZER LOOP ADICIONANDO PAGINA 1 , 2 , E MAIS
        //let page_number = 1;


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

    async writeCurrentProxies(px: IProxySimple[]): Promise<any> {
        this.current_proxies = px;
        return;
    }

    async updateStatusProxie(proxie_index: number, status: boolean): Promise<any> {
        this.current_proxies[proxie_index].in_use = status;
    }





    async extractProxies(html_text: string): Promise<any[]> {
        const $ = cheerio.load(html_text);
        let listProxies: ProxyAgentOptions[] = [];

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
                    host: ip,
                    port: String(port),
                    protocol: type,
                } as any)
            }
        });

        try {
            const proxies = { proxies: [...listProxies] }
            const jsonContent = JSON.stringify(proxies, null, 2)
            const filePath = HTML_USERS_PATH + this.file_name_proxies + '.json';

            await fs.writeFile(filePath, jsonContent, 'utf8');
            console.log(`Proxies salvos com sucesso em ${filePath}`);

            const PROXIES_JSON = JSON.parse(await this.readFileJson(this.file_name_proxies))
            if (PROXIES_JSON) {
                PROXIES_JSON.proxies.map((p) => {
                    //console.log("É UM ARRAY", p)
                })
            }
        } catch (error) {
            console.error('Erro ao salvar o arquivo JSON:', error);
        }

        // console.log("PROXIES", listProxies);
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
            const filePath = HTML_USERS_PATH + fileName + '.json';
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

//export const proxiesManager = new ProxiesManager()
