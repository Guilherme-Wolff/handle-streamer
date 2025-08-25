import * as os from 'os';

export const ROOT_PATH = process.cwd()

export let YT_DLP_PATH = ''
export let FFMPEG_PATH = ''

if (os.platform() === 'linux') {
    console.log('set path linux');
}

if (os.platform() === 'win32') {
    YT_DLP_PATH = ROOT_PATH+'/src/api/infrastructure/bin/win/yt_dlp'
    FFMPEG_PATH = ROOT_PATH+'/src/api/infrastructure/bin/win/ffmpeg/bin'
}


if (os.platform() === 'linux') {
    console.log('Sistema operacional: Linux');
} else if (os.platform() === 'win32') {
    console.log('Sistema operacional: Windows');
} else {
    console.log('Sistema operacional não reconhecido');
}

export const MIGRATIONS_PATH = ROOT_PATH+'/src/api/infrastructure/temp_html/migrations/'

export const HTML_USERS_PATH = ROOT_PATH+'/src/api/infrastructure/temp_html/'

export const COOKIE_PATH_UPLOAD = ROOT_PATH+'/src/api/infrastructure/cookies/'

export const COOKIE_PATH = COOKIE_PATH_UPLOAD+'cookies.txt'

export const PROXIES_PATH = ROOT_PATH+'/src/api/infrastructure/proxies/'


export const PATH_STREAMS_OUTPUT = ROOT_PATH+'/src/api/infrastructure/streams/'

export const PATH_STREAMS_THUMBNAILS = ROOT_PATH+'/src/api/infrastructure/thumbnails/'

export const PATH_CLIPS = ROOT_PATH+'/src/api/infrastructure/clips/'

export const PATH_STREAMS_OUTPUT_TESTS = ROOT_PATH+'/src/api/infrastructure/streams/tests/'

export const PATH_RESPONSE_UPLOADS = ROOT_PATH+'/src/api/infrastructure/responsesUploads/'

export const PATH_TEST_OUTPUT = ROOT_PATH+'/src/api/tests/process_manager/out/'

export const PATH_CERTIFICATE = ROOT_PATH+'/src/api/application/certificates/ca.crt'

export const PATH_STREAMS = ROOT_PATH+'/src/api/application/certificates/ca.crt'

//export const PATH_TEST_FILE_UPLOAD = ROOT_PATH+'/src/api/application/certificates/ca.crt'
