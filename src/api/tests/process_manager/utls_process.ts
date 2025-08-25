import { spawn } from "child_process";
import { Process } from "../../infrastructure/processManager/types"

export const createProcess = (outputname: string, id: string) => {
    // console.log(PATH_TEST_OUTPUT)
    let fmpegcmd = [
        '-f', 'lavfi',
        '-i', 'color=c=black:s=640x480:r=30',
        '-t', '3600',
        `C:\\Users\\gabri\\Documents\\projects\\savelive\\Schedules_Executor\\src\\api\\tests\\process_manager\\out\\${outputname}.mp4`
    ]

    let testProcess = spawn('ffmpeg', fmpegcmd);

    const mockProcess: Process = {
        streamer: "streamer1",
        status: 'running',
        id: id,
        process: testProcess
    };

    return mockProcess;
}