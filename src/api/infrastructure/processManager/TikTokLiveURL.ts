import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COOKIE_PATH } from "../../../../root_path.js"
import { config } from '../../application/config/index.js';

// Para usar __dirname com ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get 720p stream if available, otherwise return best quality
 * @param {Object} streams - Object containing streams by quality
 * @returns {Object|null} - Preferred stream (720p or best) or null if none available
 */
interface Stream {
  resolution: string;
  hls: string;
  bitrate: number;
}
interface getHls {
  status: boolean;
  urls: string;
  tittle: string;
}

interface BaseParams {
  aid: string;
  app_language: string;
  app_name: string;
  browser_language: string;
  browser_name: string;
  browser_online: string;
  browser_platform: string;
  browser_version: string;
  channel: string;
  cookie_enabled: string;
  data_collection_enabled: string;
  device_id: string;
  device_platform: string;
  focus_state: string;
  from_page: string;
  history_len: string;
  is_fullscreen: string;
  is_page_visible: string;
  os: string;
  priority_region: string;
  region: string;
  screen_height: string;
  screen_width: string;
  sourceType: string;
  tz_name: string;
  user_is_login: string;
  verifyFp: string;
  webcast_language: string;
  uniqueId?: string;
  referer?: string;
  root_referer?: string;
  msToken?: string;
  'X-Bogus'?: string;
  'X-Gnarly'?: string;
}

interface Cookies {
  [key: string]: string;
}

interface Headers {
  'User-Agent': string;
  Referer: string;
  Origin: string;
  Accept: string;
  'Accept-Language': string;
  Cookie: string;
  'X-Bogus': string;
  'X-Gnarly': string;
}

export class TikTokLiveURLGenerator {
  private cookieFilePath: string;
  private cookies: Cookies;
  private baseParams: BaseParams;
  private baseURL: string;

  constructor(cookieFilePath: string = COOKIE_PATH) {
    this.cookieFilePath = cookieFilePath;
    this.cookies = {};
    this.loadCookiesFromFile();

    this.baseParams = {
      aid: '1988',
      app_language: 'pt-BR',
      app_name: 'tiktok_web',
      browser_language: 'pt-BR',
      browser_name: 'Mozilla',
      browser_online: 'true',
      browser_platform: 'Win32',
      browser_version: '5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
      channel: 'tiktok_web',
      cookie_enabled: 'true',
      data_collection_enabled: 'true',
      device_id: '7528911374745323064',
      device_platform: 'web_mobile',
      focus_state: 'true',
      from_page: '',
      history_len: '3',
      is_fullscreen: 'false',
      is_page_visible: 'true',
      os: 'android',
      priority_region: 'BR',
      region: 'BR',
      screen_height: '849',
      screen_width: '1028',
      sourceType: '54',
      tz_name: 'America/Sao_Paulo',
      user_is_login: 'true',
      verifyFp: 'verify_mdarwce0_ewlnIoc8_yrz1_4CMj_BeQf_KDcJVzKRS4UG',
      webcast_language: 'pt-BR'
    };

    this.baseURL = 'https://www.tiktok.com/api-live/user/room';
  }

  private loadCookiesFromFile(): void {
    try {
      if (!fs.existsSync(this.cookieFilePath)) {
        //console.log(`Arquivo ${this.cookieFilePath} não encontrado. Usando cookies padrão.`);
        this.loadDefaultCookies();
        return;
      }

      const cookieContent = fs.readFileSync(this.cookieFilePath, 'utf8');
      this.parseCookieFile(cookieContent);

      //console.log(`✅ Cookies carregados do arquivo: ${this.cookieFilePath}`);
      //console.log(`📊 Total de cookies encontrados: ${Object.keys(this.cookies).length}`);
    } catch (error: any) {
      //console.error('❌ Erro ao ler arquivo de cookies:', error.message);
      //console.log('🔄 Usando cookies padrão...');
      this.loadDefaultCookies();
    }
  }

  private parseCookieFile(content: string): void {
    const lines = content.split('\n');

    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('#') || line === '') {
        return;
      }

      const parts = line.split('\t');
      if (parts.length >= 7) {
        const name = parts[5];
        const value = parts[6];

        if (this.isRelevantCookie(name)) {
          this.cookies[name] = value;
        }
      }
    });

    if (Object.keys(this.cookies).length === 0) {
      this.parseAlternativeCookieFormat(content);
    }
  }

  private parseAlternativeCookieFormat(content: string): void {
    const lines = content.split('\n');

    lines.forEach(line => {
      line = line.trim();
      if (line.includes('=') && !line.startsWith('#')) {
        const [name, ...valueParts] = line.split('=');
        const value = valueParts.join('=');

        if (this.isRelevantCookie(name.trim())) {
          this.cookies[name.trim()] = value.trim();
        }
      }
    });
  }

  private isRelevantCookie(name: string): boolean {
    const relevantCookies = [
      'msToken', 'sid_guard', 'ttwid', 'sessionid', 's_v_web_id',
      'tt_csrf_token', 'uid_tt', 'passport_csrf_token', 'cmpl_token',
      'multi_sids', 'sessionid_ss', 'sid_tt', 'sid_ucp_v1',
      'tt_chain_token', 'uid_tt_ss', 'ssid_ucp_v1', 'delay_guest_mode_vid',
      'perf_feed_cache', 'passport_csrf_token_default', 'FPLC', '_fbp',
      'tiktok_webapp_theme', 'FPAU', 'FPID'
    ];

    return relevantCookies.includes(name);
  }

  private loadDefaultCookies(): void {
    this.cookies = {
      'msToken': 'PtkWkxDQ_NW9g3NrFGdExcoSB-TP8ruRA0XEcft9uHFwa7SYvsmZvA_2EYVFeIQzfC87zIRuXNOIa9N7Sb9L1ITV4ITcTBM84n7TxVUmaqNAj_ZgOGSPA4ELyswqAu4P90C-nnt5Mfw9',
      'sid_guard': '23c61d4893798090ead6eb89c455c757%7C1752965247%7C15548057%7CThu%2C+15-Jan-2026+21%3A41%3A44+GMT',
      'ttwid': '1%7CY1F7lTs7wSsT45j1ZdK5xoRj3LDCA9SrW4_E_X7Zc6Y%7C1752965271%7C56bbec5e7999726412e3b37e63537fb9dd91bc2e069daee3d83f75dc624d653d',
      'sessionid': '23c61d4893798090ead6eb89c455c757',
      's_v_web_id': 'verify_mdarwce0_ewlnIoc8_yrz1_4CMj_BeQf_KDcJVzKRS4UG',
      'tt_csrf_token': 'P6pXFC05-qP55E1AKrkZ3OzH0u7G6fZTy6sM'
    };
  }

  public reloadCookies(): Cookies {
    this.loadCookiesFromFile();
    return this.cookies;
  }

  public displayLoadedCookies(): void {
    //console.log('\n=== COOKIES CARREGADOS ===');
    Object.entries(this.cookies).forEach(([name, value]) => {
      const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
      //console.log(`${name}: ${displayValue}`);
    });
    //console.log('========================\n');
  }

  private generateMsToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let token = '';
    for (let i = 0; i < 107; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private generateXBogus(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/+';
    let bogus = 'DFSz';
    for (let i = 0; i < 20; i++) {
      bogus += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return bogus;
  }

  private generateXGnarly(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/+-_';
    let gnarly = '';
    for (let i = 0; i < 400; i++) {
      gnarly += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return gnarly;
  }

  public generateLiveURL(streamerUsername: string): string {
    const params: BaseParams = {
      ...this.baseParams,
      uniqueId: streamerUsername,
      referer: `https://www.tiktok.com/@${streamerUsername}/live`,
      root_referer: `https://www.tiktok.com/@${streamerUsername}/live`,
      msToken: this.cookies.msToken || this.generateMsToken(),
      'X-Bogus': this.generateXBogus(),
      'X-Gnarly': this.generateXGnarly()
    };

    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${this.baseURL}?${queryString}`;
  }

  public generateHeaders(streamerUsername: string): Headers {
    return {
      'User-Agent': this.baseParams.browser_version,
      Referer: `https://www.tiktok.com/@${streamerUsername}/live`,
      Origin: 'https://www.tiktok.com',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      Cookie: Object.entries(this.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; '),
      'X-Bogus': this.generateXBogus(),
      'X-Gnarly': this.generateXGnarly()
    };
  }

  public async fetchLiveData(streamerUsername: string): Promise<any> {
    const url = this.generateLiveURL(streamerUsername);
    const headers = this.generateHeaders(streamerUsername);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers as any
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Erro ao buscar dados da live:', error);
      throw error;
    }
  }

  public async getLiveInfo(streamerUsername: string): Promise<any | null> {
    try {
      //console.log(`Buscando informações da live para: @${streamerUsername}`);
      //console.log(`URL gerada: ${this.generateLiveURL(streamerUsername)}`);

      const liveData = await this.fetchLiveData(streamerUsername);

      //console.log('Dados da live recebidos:');
      //console.log(JSON.stringify(liveData, null, 2));

      return liveData;
    } catch (error: any) {
      console.error(`Erro ao obter informações da live de ${streamerUsername}:`, error);
      return null;
    }
  }

  async storeHlsByQuality(streamData: any) {
    try {
      const parsedData = JSON.parse(streamData).data;
      const streamsByQuality = {};

      Object.keys(parsedData).forEach(quality => {
        if (quality !== 'ao' && parsedData[quality].main.hls) { // Exclude audio-only
          const resolution = parsedData[quality].main.sdk_params.resolution || '';
          const bitrate = parsedData[quality].main.sdk_params.vbitrate || 0;
          streamsByQuality[quality] = {
            hls: parsedData[quality].main.hls,
            resolution,
            bitrate
          };
        }
      });

      return streamsByQuality;
    } catch (error) {
      console.error('Error parsing stream data:', error);
      return {};
    }
  }

  async getPreferredQuality(streams: Record<string, Stream>): Promise<Stream | undefined> {
    const preferred = Object.values(streams).find(
      (stream: Stream) => stream.resolution === '720x1280'
    );

    return preferred || getBestQuality(streams);
  }

  async getHls720p(streamer: string): Promise<getHls> {
    const url = await this.generateLiveURL(streamer);
    const ONLINE_STATUS: number = config.processManager.TIKTOK_ONLINE_STATUS || 2;
    const resp = await fetch(url)
    if (!resp) {
      return {
        status: false,
        urls: '',
        tittle: ''
      };
    }
    const data = await resp.json(); // Parse the JSON response
    const status = data.data.user.status
    const live_room = data.data.liveRoom.streamData.pull_data.stream_data
    const tittle = data.data.liveRoom.title
    if (status === ONLINE_STATUS) {
      const storedStreams = await this.storeHlsByQuality(live_room);
      const _720p = await this.getPreferredQuality(storedStreams)
      //console.log('Preferred Quality (720p or best):', _720p?.hls);
      return {
        status: true,
        urls: _720p?.hls as string,
        tittle: tittle || ''
      };
    }
    else {
      //console.log("OFFLINE:")
      return {
        status: false,
        urls: '',
        tittle: ''

      };
    }
  }
}

function storeHlsByQuality(streamData: any) {
  try {
    const parsedData = JSON.parse(streamData).data;
    const streamsByQuality = {};

    Object.keys(parsedData).forEach(quality => {
      if (quality !== 'ao' && parsedData[quality].main.hls) { // Exclude audio-only
        const resolution = parsedData[quality].main.sdk_params.resolution || '';
        const bitrate = parsedData[quality].main.sdk_params.vbitrate || 0;
        streamsByQuality[quality] = {
          hls: parsedData[quality].main.hls,
          resolution,
          bitrate
        };
      }
    });

    return streamsByQuality;
  } catch (error) {
    console.error('Error parsing stream data:', error);
    return {};
  }
}

/**
 * Get the best quality stream available based on bitrate
 * @param {Object} streams - Object containing streams by quality
 * @returns {Object|null} - Best quality stream object or null if none available
 */
function getBestQuality(streams: any) {
  const qualities = Object.values(streams);
  if (!qualities.length) return null;

  return qualities.reduce((best: any, current: any) => {
    return current.bitrate > best.bitrate ? current : best;
  }) as any
}


function getPreferredQuality(streams: Record<string, Stream>): Stream | undefined {
  const preferred = Object.values(streams).find(
    (stream: Stream) => stream.resolution === '720x1280'
  );

  return preferred || getBestQuality(streams);
}



export const getHls720p = async (streamer: string): Promise<getHls> => {
  const generator = new TikTokLiveURLGenerator(COOKIE_PATH);
  const url = generator.generateLiveURL(streamer);
  const ONLINE_STATUS: number = config.processManager.TIKTOK_ONLINE_STATUS || 2;
  //const ONLINE_STATUS: number =  2;
  const resp = await fetch(url,{
    headers:{
      'Referer':`https://www.tiktok.com/@${streamer}/live`,
      'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
  })
  const data = await resp.json(); // Parse the JSON response
  const status = data.data.user.status
  const live_room = data.data.liveRoom.streamData.pull_data.stream_data
  const tittle = data.data.liveRoom.title

  if (status === ONLINE_STATUS) {
    const storedStreams = storeHlsByQuality(live_room);
    //console.log('Stored Streams:', storedStreams);
    //console.log('Best Quality:', getBestQuality(storedStreams));
    const _720p = getPreferredQuality(storedStreams)
    console.log('Preferred Quality (720p or best):', _720p?.hls);
    return {
      status: true,
      urls: _720p?.hls as string,
      tittle: tittle || ''
    };
  }
  else {
    console.log("OFFLINE:")
    return {
      status: false,
      urls: '',
      tittle: ''

    };
  }
}

//getHls720p("ops_ruiva_")