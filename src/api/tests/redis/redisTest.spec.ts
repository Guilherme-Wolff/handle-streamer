import jest from "jest"

import { redisService } from "../../application/services/redis.service"

const NUMBER_OF_PROCESS = 2

const VOID: number = 0;
let dataTest = { streamer: 'testStreaerm1', plataforma: 'Plataforma1' }
let dataTest2 = { streamer: 'testStreaerm2', plataforma: 'Plataforma1' }

describe('REDIS TEST FUNCTIONS', () => {
    let redis: redisService;

    beforeEach(() => {
        redis = new redisService({
            host: 'redis-18821.c308.sa-east-1-1.ec2.cloud.redislabs.com',
            port: 18821,
            password: 'sPtltqahBC72EOAadqkNirbwsyHIFm95',
        });
    });

    test('Adicionar streamer', async () => {
        await redis.clearList()

        const SIZETEST: number[] = Array.from({ length: NUMBER_OF_PROCESS });

        const res1 = await redis.addStreamer(dataTest);
        console.log("RESPOSE :", res1)
        const res2 = await redis.addStreamer(dataTest2);
        console.log("RESPOSE :", res2)

        //TRYING TO REPLICATE STREAMER
        const res3 = await redis.addStreamer(dataTest);


        //await new Promise(resolve => setTimeout(resolve, 4000)); 
        let size = await redis.getSize()
        console.log("SIZE LIST OF STREAMERS", size)

        await expect(size).toBe(NUMBER_OF_PROCESS);

        //await processManager.stopProcesssByiD('1');
        await redis.clearList()
    });

    test('check if a streamer exists', async () => {
        await redis.clearList()

        //const SIZETEST: number[] = Array.from({ length: NUMBER_OF_PROCESS });

        const res1 = await redis.addStreamer(dataTest);
        console.log("RESPOSE :", res1)
        //const res2 = await redis.addStreamer(dataTest2);
        let exist = await redis.streamerExist(dataTest);
        console.log("Esxist :", exist)

        await expect(exist).toBe(1);

        //await processManager.stopProcesssByiD('1');
        await redis.clearList()
    });

    test('clear list redis', async () => {
        await redis.clearList()

        const size = await redis.getSize()
        console.log("SIZE LIST OF STREAMERS", size)

        await expect(size).toBe(0);
    });
    

});





