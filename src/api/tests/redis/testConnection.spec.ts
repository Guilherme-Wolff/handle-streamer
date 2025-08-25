import jest from "jest"

import { redisServiceInstance } from "../../application/services/redis.service"

describe('REDIS TESTS CONNECTION', () => {

    beforeEach(() => {
    });

    test('test connection with mod production redis', async () => {
        const connection = await redisServiceInstance.testConnection();

        await expect(connection).toBe(true);

        //await processManager.stopProcesssByiD('1');
        //await redisServiceInstance.clearList()
    });
});





