import jest from "jest"

import { ProcessManager } from "../../infrastructure/processManager/processManager"
import { Process } from "../../infrastructure/processManager/types"
import { spawn } from "child_process";
import { PATH_TEST_OUTPUT } from "../../../../root_path"

import { createProcess } from "./utls_process"

const NUMBER_OF_PROCESS = 2

const VOID: number = 0;


describe('ProcessManager', () => {
    let processManager: ProcessManager;

    beforeEach(() => {
        processManager = new ProcessManager();
    });

    test('Adicionar varios processo', async () => {

        const SIZETEST: number[] = Array.from({ length: NUMBER_OF_PROCESS });

        SIZETEST.map(async (pp: any, id: number) => {
            const prc = createProcess(`out${id}`, `id${id}`)

            await processManager.addProcess(prc);
        })


        //await new Promise(resolve => setTimeout(resolve, 4000)); 
        let size = await processManager.getSize()
        await expect(size).toBe(NUMBER_OF_PROCESS);

        //await processManager.stopProcesssByiD('1');
    });

});


describe('ProcessManager clear', () => {
    let processManager: ProcessManager;

    beforeEach(() => {
        processManager = new ProcessManager();
    });

    test('Adicionar varios processo', async () => {

        const SIZETEST: number[] = Array.from({ length: NUMBER_OF_PROCESS });

        //await new Promise(resolve => setTimeout(resolve, 4000)); 
        let size = await processManager.getSize()


        SIZETEST.map(async (pp: any, id: number) => {
            //const prc = createProcess(`out${id}`, `id${id}`)

            await processManager.stopProcesssByiD(`id${id}`);
        })


        await expect(size).toBe(VOID);
    });

});





