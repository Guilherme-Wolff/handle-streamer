import * as fs from 'node:fs';
//import { fileURLToPath } from 'url';
import fsPrimisse from 'fs/promises';
import { ProxyAgent, ProxyAgentOptions } from "proxy-agent"

//import { HttpsProxyAgent } from 'https-proxy-agent'

import { WebcastPushConnection } from 'tiktok-live-connector';

import { LiveService } from "./lives.service.js"


import { PATH_RESPONSE_UPLOADS, PATH_STREAMS_OUTPUT } from "../../../../root_path.js"

import { IProxySimple } from "./get_proxies.js"

//import { ProxiesManager } from "./get_proxies.js"


export interface ChatMessage {
    type?: string;
    messageId: string;
    timestamp: string | number;
    user: {
        userId: string;
        username: string;
        userRole: string;
    };
    message: {
        text?: string;
        emotes?: string[];
        attachments?: { type: string; url: string }[];
        giftId?:string;
        giftName?:string;
    };
};



export interface ChatData {
    metadata: {
        liveStart: string;
    };
    chatLog: ChatMessage[];
}



type ChatMessageChat = {
    "messageId": "1",
    "timestamp": 1,
    "user": {
        "userId": "12345",
        "username": "User1",
        "userRole": "viewer"
    },
    "message": {
        "text": "Hello everyone! Hello everyone!Hello everyone!Hello everyone!Hello everyone!Hello everyone!Hello everyone!",
        "emotes": [],
        "attachments": [],
    }
}

type ChatMetadata = {
    totalMessages: number;
    createdAt: string;
    updatedAt: string;
};

type VODChat = {
    vodId: string;
    title: string;
    duration: number;
    chat: ChatMessage[];
    metadata: ChatMetadata;
};

/*interface IProxyConfig {
    in_use:boolean,
    protocol: string,
    host: string,
    port: number,
    auth?: string
}*/


/*const proxyConfig: ProxyAgentOptions = {
    protocol: 'https',//protocolor importante
    host: 'host',
    port: 80,
    auth: 'username:password'
};*/

interface ITiktokChat {
    initializeConnection(): void;
}

interface IinitializeConnection_Status {
    disconnect_now: boolean;
}





export class TiktokChat {
    public stream_id: string = "";
    public streamer: string = "";
    public json_name: string = "";
    public path_name: string = "";
    public vodStartTime = Date.now()
    public chatHistory:ChatMessage[] = []
    public proxy = {}

    public intervalId



    public current_proxy: IProxySimple;

    private chatHistoryInterval: NodeJS.Timeout | null = null;

    constructor(_stream_id: string, _streamer: string, _path_name: string, _json_name: string, _proxy: IProxySimple) {
        this.stream_id = _stream_id;
        this.streamer = _streamer;
        this.json_name = _json_name;
        this.current_proxy = _proxy;
        this.path_name = _path_name

    }

    public tiktokLiveConnection: WebcastPushConnection | null;

    public async initializeConnection(input_status: IinitializeConnection_Status) {

        console.log("CHAT CONFIG", `
            STREAMER:${this.streamer}
            PROXIE: 
              host:${this.current_proxy.host}
              port:${this.current_proxy.port}
              protocol:${this.current_proxy.protocol}
            `)
        //let chatHistory = {};

        //const httpsAgent = this.createProxyAgent(this.current_proxie);


        try {

            const proxy_string = `http://${this.current_proxy.host}:${this.current_proxy.port}`

            const agent = new ProxyAgent(proxy_string as ProxyAgentOptions);

            this.tiktokLiveConnection = new WebcastPushConnection(this.streamer, {
                requestOptions: {
                    httpsAgent: agent,
                    timeout: 10000 // 10 seconds
                },
                websocketOptions: {
                    httpsAgent: agent,
                    timeout: 10000 // 10 seconds
                }
            });


            //let tiktokLiveConnection = new WebcastPushConnection(this.streamer);
            this.vodStartTime = Date.now();
            const state = await this.tiktokLiveConnection.connect();
            //console.info(`Conectado ao roomId ${state.roomId}`);

            this.setupEventHandlers(this.chatHistory);

            this.ensureJSONFileExists()

            // Periodicamente salva o histórico de chat em um arquivo JSON
            //passa path

            //setInterval(() => this.saveChatHistoryAcumulate(this.chatHistory), 10000);
            //this.chatHistoryInterval = setInterval(() => this.saveChatHistoryAcumulate(this.chatHistory), 10000); // Salva a cada 10 segundos
            await this.saveChatInterval()


        } catch (err) {
            console.error('Falha ao conectar', err);
        }
    }

    public async saveChatInterval() {


        // Verifica se o intervalo já está ativo para evitar múltiplas execuções
        if (this.chatHistoryInterval) {
            console.log("Intervalo já está em execução.");
            return;
        }

        // Salva o ID do intervalo na propriedade da classe
        this.chatHistoryInterval = setInterval(async () => {

            this.saveChatHistoryAccumulate_2(this.chatHistory)


        }, 10000);
    }

    public clearChatHistoryInterval() {
        if (this.chatHistoryInterval) {
            clearInterval(this.chatHistoryInterval);
            this.chatHistoryInterval = null;
            console.log("Chat history saving interval cleared.");
        }
    }

    public stopChatHistorySaving() {
        if (this.chatHistoryInterval) {
            clearInterval(this.chatHistoryInterval);

            this.chatHistoryInterval = null; // Limpa a referência
        }
    }



    public async disconnect(): Promise<void> {
        if (this.tiktokLiveConnection) {
            this.stopChatHistorySaving()

            this.tiktokLiveConnection.removeAllListeners()
            this.tiktokLiveConnection.disconnect()
            this.tiktokLiveConnection = null;

        }
        return;

    }

    public async setupEventHandlers(chatHistory: any): Promise<void> {

        if (this.tiktokLiveConnection) {
            this.tiktokLiveConnection.on('chat', data => {
                const vodTime = Date.now() - this.vodStartTime;
                const message: ChatMessage = {
                    type: 'chat',
                    messageId: data.uniqueId,
                    timestamp: vodTime,
                    user: {
                        userId: data.userId,
                        username: data.userId,
                        userRole: ''
                    },
                    message: {
                        text: data.comment,
                        //emotes: [''],
                        //attachments?;
                    }
                    //vodTime: Date.now() - this.vodStartTime // Tempo em segundos desde o início do VOD
                };
                //chatHistory.push(message);
                /*if (!chatHistory.length) {
                    chatHistory = [];
                }*/
                this.chatHistory.push(message);
                ////console.log(`${message.uniqueId} (userId:${message.userId}) escreveu: ${message.comment} `);
                //console.log(`${message.uniqueId} (userId:${message.userId}) escreveu: ${message.comment}`);
            });



            // Lidando com presentes enviados ao streamer (opcional)
            this.tiktokLiveConnection.on('gift', data => {

                if (data.giftType === 1 && !data.repeatEnd) {

                } else {

                }

                const vodTime = Date.now() - this.vodStartTime;

                const event: ChatMessage = {
                    type: 'gift',
                    messageId: data.uniqueId,
                    timestamp: vodTime,
                    user: {
                        userId: data.userId,
                        username: data.userId,
                        userRole: ''
                    },
                    message: {
                        giftId: data.giftId,
                        giftName: data.giftName
                        //attachments?;
                    }
                    //vodTime: Date.now() - this.vodStartTime // Tempo em segundos desde o início do VOD
                };
                /*if (this.chatHistory) {
                    this.chatHistory[vodTime] = [];
                }*/
                this.chatHistory.push(event);
                //console.log(`GIFT --> ${data.uniqueId} (userId:${data.userId}) enviou o presente com giftId: ${data.giftId}`);
            });

            /*this.tiktokLiveConnection.on('linkMicBattle', (data) => {
                const vodTime = Date.now() - this.vodStartTime;
                const event = {
                    type: 'linkMicBattle',
                    streamer_of_battle: [data.battleUsers]

                    //vodTime: Date.now() - this.vodStartTime // Tempo em segundos desde o início do VOD
                };
                if (!chatHistory[vodTime]) {
                    chatHistory[vodTime] = [];
                }
                chatHistory[vodTime].push(event);
                //console.log(`New Battle: ${data.battleUsers[0].uniqueId} VS ${data.battleUsers[1].uniqueId}`);
            })*/

            /*this.tiktokLiveConnection.on('linkMicArmies', (data) => {
                //console.log('linkMicArmies', data);
            })*/

            /*this.tiktokLiveConnection.on('streamEnd', (actionId) => {
                if (actionId === 3) {
                    console.log(`
                        Stream ended by user > === END  ==
                        === END  === END  === END  === END  
                        `);
                }
                if (actionId === 4) {
                    //console.log('Stream ended by platform moderator (ban)');
                }
            })*/

            this.tiktokLiveConnection.on('disconnected', (data) => {
                if (this.tiktokLiveConnection) {
                    this.tiktokLiveConnection.disconnect()
                }

            });

        }




    }



    public async saveChatHistoryAcumulate(chatHistory: any): Promise<void> {
        //const filePath = PATH_RESPONSE_UPLOADS + this.json_name;
        const filePath = `${PATH_STREAMS_OUTPUT}${this.path_name}/${this.json_name}`;

        try {
            // Lê o conteúdo existente do arquivo, se existir
            let existingData = {}

            try {
                const data = await fsPrimisse.readFile(filePath, 'utf8');
                existingData = JSON.parse(data);
            } catch (err: any) {
                // Se o arquivo não existir ou houver um erro ao ler, inicializa como um objeto vazio
                if (err.code !== 'ENOENT') {
                    console.error('Erro ao ler o histórico existente:', err);
                }
            }

            // Mescla o histórico de chat existente com o novo
            for (const [vodTime, messages] of Object.entries(chatHistory)) {
                if (!existingData[vodTime]) {
                    existingData[vodTime] = [];
                }
                if (Array.isArray(messages)) {
                    existingData[vodTime].push(...messages);

                }
            }

            // Salva o JSON atualizado de volta no arquivo
            await fsPrimisse.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
            console.info('Histórico de chat salvo com sucesso.');
        } catch (error) {
            console.error('Erro ao salvar o histórico de chat:', error);
        }
    }

    async ensureJSONFileExists() {
        const filePath = `${PATH_STREAMS_OUTPUT}${this.path_name}/${this.json_name}`;
        if (!fs.existsSync(filePath)) {
            // Se o arquivo não existe, cria-o com os dados iniciais
            const initialData = {
                metadata: {
                    liveStart: new Date(this.vodStartTime).toISOString(),
                },
                chatLog: [],
            };

            // Escreve o JSON no arquivo
            fs.writeFileSync(filePath, JSON.stringify(initialData, null, 4), 'utf-8');
            //console.log(`Arquivo JSON criado em: ${filePath}`);
        } else {
            //console.log('Arquivo já existe.');
        }
    }
    public async saveChatHistoryAccumulate_2(chatHistory: any): Promise<void> {
        const filePath = `${PATH_STREAMS_OUTPUT}${this.path_name}/${this.json_name}`;
        
        try {
                let existingData :ChatData;

 
                const data = await fsPrimisse.readFile(filePath, 'utf8');
                existingData = JSON.parse(data) as ChatData;
            

                existingData.chatLog.push(chatHistory);

            // Salva o JSON atualizado no arquivo
            await fsPrimisse.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf8');

            this.chatHistory = []
            //console.info('Histórico de chat salvo com sucesso em:', filePath);
        } catch (error) {
            console.error('Erro ao salvar o histórico de chat:', error);
        }
    }



    // Função para salvar o histórico de chat em um arquivo JSON
    public saveChatHistory(chatHistory): void {

        fs.writeFile(PATH_RESPONSE_UPLOADS + this.json_name, JSON.stringify(chatHistory, null, 2), (err) => {
            if (err) {
                console.error('Erro ao salvar o histórico de chat:', err);
            } else {
                //console.info('Histórico de chat salvo com sucesso.');
            }
        });

        //this.chatHistory = {}



        /*
        const filePath = path.join(PATH_RESPONSE_UPLOADS, this.json_name);

        // Lê o conteúdo existente do arquivo, se existir
        fs.readFile(filePath, 'utf8', (err, data) => {
            let existingData = {};

            if (!err && data) {
                try {
                    existingData = JSON.parse(data);
                } catch (parseError) {
                    console.error('Erro ao analisar o arquivo JSON existente:', parseError);
                }
            }

            // Mescla o histórico de chat existente com o novo
            for (const [vodTime, messages] of Object.entries(chatHistory)) {
                if (!existingData[vodTime]) {
                    existingData[vodTime] = [];
                }
                existingData[vodTime].push(...messages);
            }

            // Salva o JSON atualizado de volta no arquivo
            fs.writeFile(filePath, JSON.stringify(existingData, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('Erro ao salvar o histórico de chat:', writeErr);
                } else {
                    //console.info('Histórico de chat salvo com sucesso.');
                }
            });

            // Limpa o histórico de chat atual após o salvamento
            this.chatHistory = {};
        });
    }
        
        */

    }

    async loadChatJson(path: string): Promise<any> {
        try {
            const data: any = await fsPrimisse.readFile(path, 'utf8');

            // Converte a string JSON em um objeto JavaScript
            const vodChatData = JSON.parse(data);

            console.log(vodChatData);
            return vodChatData; // Retorna os dados, 
        } catch (error) {
            console.error('Erro ao ler o arquivo JSON:', error);
        }
    }


    async addChatMessage(vodChatData, newMessage) {
        vodChatData.chat.push(newMessage);
        vodChatData.metadata.totalMessages += 1;
        vodChatData.metadata.updatedAt = new Date().toISOString();
    }

    async saveJSONToFile(filePath, jsonData) {

        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    }

}
