import jest from "jest"

import { ProcessManager } from "../../infrastructure/processManager/processManager"
import { Process } from "../../infrastructure/processManager/types"
import { spawn } from "child_process";

let fmpegcmd = [
  '-f', 'lavfi',
  '-i', 'color=c=black:s=640x480:r=30',
  '-t', '3600',
  'output.mp4'
]

let testProcess = spawn('ffmpeg', fmpegcmd)

describe('ProcessManager', () => {
  let processManager: ProcessManager;

  beforeEach(() => {
    processManager = new ProcessManager();
  });

  test('Adicionar processo', async () => {
    const mockProcess: Process = {
      streamer: "streamer1",
      status: 'running',
      id: '1',
      process: testProcess
    };


    await processManager.addProcess(mockProcess);

    let size = await processManager.getSize()
    expect(size).toBe(1);

    //await processManager.stopProcesssByiD('1');
  });

  test('Parar processo por ID', async () => {
    const mockProcess: Process = {
      streamer: "streamer1",
      status: 'running',
      id: '2',
      process: testProcess,
    };

    //await processManager.addProcess(mockProcess);
    await processManager.stopProcesssByiD('1');

    let size = await processManager.getSize()
    expect(size).toBe(0);
  });

});



