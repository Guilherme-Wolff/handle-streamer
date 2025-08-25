import Redis, { RedisOptions } from 'ioredis';
import * as fs from 'node:fs'

import { PATH_CERTIFICATE } from "../../../../root_path"

interface StreamerData {
    streamer: string;
    plataforma: string;
}

interface addProcessResponse {
    status: number;//OK //
    message: string;
}

export class redisService {
    private client: Redis;

    constructor(options: RedisOptions) {
        this.client = new Redis(options);

        this.client.on('connect', () => {
            console.log('Conectado ao Redis CLOUD CLUSTERS');
            console.log("CERTIFICATE:", PATH_CERTIFICATE)
        });

        this.client.on('error', (err) => {
            console.log(`Erro na conexão com o Redis: ${err}`);
        });
    }
    async streamerExist(data: StreamerData): Promise<number> {
        return await this.client.sismember('streamers', JSON.stringify(data));
    }

    async addStreamer(data: StreamerData): Promise<void | addProcessResponse> {
        let response: addProcessResponse = {
            status: 1,
            message: 'OK'
        }
        let result = await this.client.sadd('streamers', JSON.stringify(data));
        console.log("RESUULT", result)
        console.log(`Streamer ${data.streamer} adicionado com sucesso.`);
        if (result === 1) {
            return response;
        } else {
            response.status = 0
            response.message = 'streamer already exists'

            return response;
        }
    }

    async getSize(): Promise<number> {
        const size = await this.client.scard('streamers');
        return size;
    }

    async clearList(): Promise<any> {

        await this.client.del('streamers');

    }



    async listStreamers(): Promise<StreamerData[]> {
        // Recupera todos os membros do conjunto 'streamers'
        const members = await this.client.smembers('streamers');
        const dataList: StreamerData[] = members.map((rawData) => JSON.parse(rawData) as StreamerData);

        console.log('Lista de streamers:', dataList);
        return dataList;
    }

    async testConnection(): Promise<boolean> {
        let res = true;
        await this.client.on('connect', () => {
            res = true;
        });
        await this.client.on('error', (err) => {
            res = false;
        });
        return res;
    }

    async closeConnection(): Promise<void> {
        await this.client.quit();
        console.log('Conexão com o Redis fechada.');
    }
}

const redisOptions: RedisOptions = {
    host: 'redis-155624-0.cloudclusters.net',
    username: 'guiw',
    port: 18284,
    password: '123456789',
    tls: {
        rejectUnauthorized: false,
        //ca: fs.readFileSync(PATH_CERTIFICATE),
    },
};

export const redisServiceInstance = new redisService(redisOptions);

/*async function main() {
    const redisOptions: RedisOptions = {
        host: 'redis-155527-0.cloudclusters.net',
        username: 'guiw',
        port: 18282,
        password: 'sPtltqahBC72EOAadqkNirbwsyHIFm95',
        tls: {
            rejectUnauthorized: false,
            ca: fs.readFileSync(PATH_CERTIFICATE),
        },
    };

    const redisController = new RedisController(redisOptions);

    try {
        // Adicionar streamers
        const res1 = await redisController.addStreamer({ streamer: 'GTStreamer1', plataforma: 'Plataforma1' });
        console.log("res1 : ", res1)
        const res2 = await redisController.addStreamer({ streamer: 'GTStreamer2', plataforma: 'Plataforma2' });
        console.log("res2 : ", res2)
        // Tentar adicionar o mesmo streamer novamente
        const res3 = await redisController.addStreamer({ streamer: 'GTStreamer1', plataforma: 'Plataforma1gh' });
        console.log("res3 : ", res3)
        // Listar todos os streamers (não deve conter duplicatas)
        const allStreamers = await redisController.listStreamers();
    } catch (error) {
        console.error(`Erro durante as operações Redis: ${error}`);
    } finally {
        await redisController.closeConnection();
    }
}

main();*/

