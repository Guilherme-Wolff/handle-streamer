import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
//import fs from 'fs';
import fetch from 'node-fetch';

import path from 'path';

import * as fs from "fs"

import { v4 as uuidv4 } from 'uuid';

//const GET_SERVER_URL = 'https://api.gofile.io/getServer';

interface ServerUploaderData {
  data: {
    server: string;
  };
}

export interface IResposeUpload {
  sucess: boolean;
  url: string
}

interface UploadBunkrResponse2 {
  success: boolean;
  files: {
    name: string;
    url: string;
  }[];
}

interface UploadBunkrResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export class UploaderService {

  constructor() { }

  private IMGBB_CLIENT_API_KEY: string = '713bcfdb3686407e86c8061d80f78369'

  public urlUpload = `https://api.imgbb.com/1/upload?key=${this.IMGBB_CLIENT_API_KEY}`


/**
 * Uploads an image from a given URL to a remote server and returns the upload response.
 * @param urlImagem - The URL of the image to be uploaded.
 * @returns A promise that resolves to an object containing the upload success status and the image URL.
 * @throws Error if the image cannot be fetched or if the upload fails.
 */
  public async userImageUploaderBunkr(urlImagem: string): Promise<IResposeUpload | any> {

    let resp: IResposeUpload = {
      sucess: false,
      url: ''
    }

    try {
      const responseImagem = await fetch(urlImagem);
      if (!responseImagem.ok) {
        throw new Error(`Erro ao obter a imagem: ${responseImagem.status} - ${responseImagem.statusText}`);
      }

      const respostaImagemArrayBuffer = await responseImagem.arrayBuffer();

      const uint8Array = new Uint8Array(respostaImagemArrayBuffer);

      let binaryString = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }

      // Passo 3: Converta a string binária em Base64
      const base64String = btoa(binaryString);


      //const FILE_NAME = await uuidv4()

      const form = new FormData();

      //const imageFile = fs.readFileSync(respostaImagemArrayBuffer);
      //const base64Image = Buffer.from(respostaImagemArrayBuffer).toString('base64');
      //CONSERTAR
      form.append('image', base64String);

      const headers = {
        token: this.IMGBB_CLIENT_API_KEY,
        ...form.getHeaders(),
      };

      const responseUpload = await fetch(this.urlUpload, {
        method: 'POST',
        body: form,
        //headers: headers
      });

      const data: UploadBunkrResponse = await responseUpload.json();

      if (data.success) {
        const { url } = data.data;

        resp.sucess = true;
        resp.url = url

        return resp;
      }

      return resp;

    } catch (error: any) {
      console.error('Erro durante o upload:', error.message);
    }
  }

  public async thumbnailUpload(filePath: string): Promise<IResposeUpload> {
    let resp: IResposeUpload = {
      sucess: false,
      url: ''
    };
  
    try {
      // Lê o arquivo localmente
      const fileStream = fs.createReadStream(filePath);

      const fileName = path.basename(filePath); 

  
      // Cria o FormData e adiciona o arquivo lido
      const form = new FormData();
      
      form.append('image', fileStream, { filename: fileName }); // Nome do arquivo pode ser ajustado
  
      const responseUpload = await fetch(this.urlUpload, {
        method: 'POST',
        body: form,
        //headers: headers
      });
  
      const data: UploadBunkrResponse = await responseUpload.json();
  
      if (data.success) {
        const { url } = data.data;
  
        resp.sucess = true;
        resp.url = url;
  
        return resp;
      }
  
      return resp;
  
    } catch (error: any) {
      console.error('Erro durante o upload:', error.message);
    }

    return resp;
  }

}

// Substitua com suas informações

//userImageUploader(urlImagem, token, urlUpload);
