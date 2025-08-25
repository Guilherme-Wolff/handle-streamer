import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { ServerDescription } from 'typeorm';
import { config } from "../config/index.js"

let ID = 'Eh1C3JiB'


export interface ICreateAlbum {
    title: string;
    anonymous: boolean;
    files: [{ id: string, description: string }]

}

interface SessionKeys {
    auth_key: string;
    creation_ip_address: string;
    user_agent: string;
    app_name: string;
    creation_time: string;
    last_used_time: string;
}
//bypass
//https://pd.cybar.xyz/

export class Pixeldrain {
    public API_KEY: string;
    public BASE_API: string = "https://pixeldrain.com/api"
    constructor(_API_KEY: string = process.env.PIXELDRAIN_API_KEY || config.BUCKET_FILES.PIXELDRAIN_API_KEY) {

        if (_API_KEY) {
            this.API_KEY = _API_KEY;
            this.updateKey().then(key => key)
        }

    }



    //reescreever a variavel de ambiente
    public async updateKey(): Promise<string> {
        const res = await fetch(`${this.BASE_API}/user/session`, {
            headers: {
                'Cookie': `pd_auth_key=${this.API_KEY}`,
            }
        })

        const keys = await res.json() as SessionKeys[]
        config.BUCKET_FILES.PIXELDRAIN_API_KEY = keys[0].auth_key
        this.API_KEY = keys[0].auth_key;

        return await keys[0].auth_key;
    }

    public geteKey() {


        return this.API_KEY
    }
    public async createAlbum(albumData: ICreateAlbum): Promise<any> {

        const url = `${this.BASE_API}/list`;

        const headers = {
            'Content-Type': 'application/json',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Cookie': `pd_auth_key=${this.API_KEY}`, //neceessary
        };

        try {
            const response: Response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(albumData),
            });

            if (response.ok) {
                const responseData: any = await response.json();
                // console.log('Album created successfully:', responseData);
                return responseData.id

            } else {
                // console.error('Failed to create album:', response.statusText);
                return;
            }
        } catch (error) {
            console.error('Error createAlbum:', error);
        }
    }

    public async getFilesList(albumID: string): Promise<any[] | any> {
        const headers = {
            'Origin': 'pixeldrain.com',
            'Referrer-Policy': 'strict-origin-when-cr,oss-origin',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application / json',
            'Cookie': `pd_auth_key=${this.API_KEY}`,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
        };

        const res = await fetch(`${this.BASE_API}/list/${albumID}`, {
            method: "GET",
            headers: headers,
            //body: fileData
        });

        if (res.ok) {
            const responseData: any = await res.json();
            const files: any = await responseData.files;

            const ids = files.map(item => item.id);

            const files_: any[] = ids.map(id => ({ id: id, description: '' }));
            //console.log("LIST == LIST == LIST == LIST", files_);
            return await files_;


            //return await responseBody.id
        } else {
            console.error("Erro ao pegar lista:", res.status);
        }

    }

    public async upload(path: string, name: string): Promise<any> {
        const fileData = readFileSync(path);

        try {
            const headers = {
                'Origin': 'pixeldrain.com',
                'Referer': 'https://pixeldrain.com/',
                //'Content-Type': 'application / json',
                'Cookie': `pd_auth_key=${this.API_KEY}`,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
            };

            const res = await fetch(`https://pixeldrain.com/api/file/${name}`, {
                method: "PUT",
                headers: headers,
                body: fileData
            });

            if (res) {
                const responseBody: any = await res.json()
                //console.log("OK upload", responseBody);
                return await responseBody.id
            }
        } catch (err) {
            console.error(err)
        }
    }

    public async addFileInAlbum(stream_id: string, albumID: string, streamer_name: string): Promise<void> {
        const files = await this.getFilesList(albumID);

        await files.push({ id: stream_id, description: '' })

        //console.log("ID FUNÇAO : ", stream_id)

        const url = `https://pixeldrain.com/api/list/${albumID}`;

        const albumDataWithId = {
            "title": streamer_name,//uuid
            "anonymous": false,
            "files": files

        }
        //console.log("FILES FIM :", files)


        const headers = {
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Type': 'application/json',
            'Cookie': `pd_auth_key=${this.API_KEY}`, //neceessary
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'

        };

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(albumDataWithId),
            });

            if (response.ok) {
                const responseData = await response.json();
                //console.log('arquivo addicionado:', responseData);
                return;
            } else {
                //console.error('Failed add file in album:', response.statusText);
                return;
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}
