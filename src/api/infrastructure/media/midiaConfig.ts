
const options: any = {
    detached: true, // Permite que o processo filho seja executado em segundo plano
    stdio: 'ignore', // Ignora a saída padrão
  };
  
export const GET_FFMPEG_ARGS = (urlHLS:string,PATH_LIVES:string,UUID_NAME_ID:string) => {
    let FFMPEG_ARGS = [
        '-y',
        '-loglevel', 'quiet',
        '-hide_banner',
        '-headers',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\nAccept-Language: en-us,en;q=0.5\nSec-Fetch-Mode: navigate',
        '-i', urlHLS,
        '-c', 'copy',
        '-f', 'mpegts',
        `file:${PATH_LIVES}\\${UUID_NAME_ID}.mp4`,
      ];
    return FFMPEG_ARGS
}