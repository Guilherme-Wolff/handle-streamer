import axios from 'axios';
import * as fs from 'fs/promises';
import * as fs_sync from 'node:fs';
import * as cheerio from 'cheerio';

import { HTML_USERS_PATH } from "../../../../root_path.js"

import { spawn } from "child_process";

//const HTML_USERS_PATH = 'C:\\Users\\gabri\\Documents\\projects\\savelive\\country'

export class CountryService {
  constructor() { }
  async getCountry(name: string, plataform: string = 'tiktok'): Promise<any> {
    console.log("start")
    const user_url = `https://www.tiktok.com/@${name}`;
    let existCountry = {
      exist: false,
      country: ''
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
      const country = await this.extractCountry(responseHTML);
      //const URL_IMG_FIXED = await this.fix_url(url);

      existCountry.exist = true;
      existCountry.country = country

      // Excluir o arquivo HTML se necessário
      await this.deleteFile(HTML_USERS_PATH + user_html);

      return await existCountry;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  async extractCountry(html_text: string, platform: string = 'tiktok'): Promise<any> {
    const $ = await cheerio.load(html_text);

    // Use a more robust regex that handles nested objects
    //const regex = /"mainEntity"\s*:\s*({(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*})/;
    //const match = $('body').text().match(regex);
    const regex = /"region":"([^"]+)"/;
    const match = $('body').text().match(regex);

    if (!match || !match[1]) {
        console.log("No userInfo match found");
        return null;
    }

    try {
        const country = match[1];
        return country;
    } catch (e) {
        console.error("Error parsing userInfo JSON:", e);
        //console.error("Processed string:", String(jsonString));
        return null;
    }
}

  async extractCountry2(html_text: string, platform: string = 'tiktok'): Promise<any> {
    const $ = await cheerio.load(html_text);
    
    // Use a more robust regex that handles nested objects
    const regex = /"userInfo"\s*:\s*({(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*})/;
    const match = $('body').text().match(regex);
    
    if (!match || !match[1]) {
      console.log("No userInfo match found");
      return null;
    }
  
    try {
      // Pre-process the JSON string
      let jsonString = match[1]
        .replace(/\\u002F/g, "/")
        .replace(/\n/g, "")
        .replace(/\\"/g, '"')        // Handle escaped quotes
        .replace(/,\s*}/g, '}')      // Remove trailing commas
        .replace(/,\s*]/g, ']');     // Remove trailing commas in arrays
      
      // Try to balance braces if needed
      let openBraces = (jsonString.match(/{/g) || []).length;
      let closeBraces = (jsonString.match(/}/g) || []).length;
      
      while (openBraces > closeBraces) {
        jsonString += '}';
        closeBraces++;
      }
      
      // Add logging for debugging
      //console.log("Processed JSON string:", jsonString);
      
      const userInfo = JSON.parse(jsonString);
      const country = userInfo.user.region as string;
      const c = country.toLowerCase();
      return c;
    } catch (e) {
      //console.error("Error parsing userInfo JSON:", e);
      //console.error("Processed string:", jsonString);
      return null;
    }
  }
  async fix_url(url: string): Promise<any> {
    const urlCorrigida = await url.replace(/\\u002F/g, '/');
    return await urlCorrigida;
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