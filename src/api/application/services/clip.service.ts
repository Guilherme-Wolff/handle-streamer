import "reflect-metadata"
import { promises as fsPromises } from 'fs';
import { unlink } from 'fs/promises';
import { container, injectable } from "tsyringe"
import { DeleteResult, Equal } from "typeorm"
import { v4 as uuid4 } from "uuid"
import { Users } from "../../domain/entities/users.entity.js"
import { AuthRepository } from "../RepositoryImpl/auth.repository.js"
import { UsersRepository } from "../RepositoryImpl/users.repository.js"
import { ClipRepository } from "../RepositoryImpl/clip.repository.js"
import { EntityType } from "../../infrastructure/utils/entity-types.js"
import { Clip } from "../../domain/entities/clip.entity.js"

import { ThumbnailService } from '../../application/services/thumbnail.service.js';
import { UploadBunkrService } from '../../application/services/upload.bunkr.service.js';

import { config } from "../config/index.js"
import fs from 'fs/promises';

import * as fs_sync from 'fs';

import { PATH_STREAMS_THUMBNAILS, PATH_CLIPS } from "../../../../root_path.js"

/**
 * Implementation of the Chargepoint bussiness logic layer.
 * 
 * Service is made available as an injectable for DI container specified in bootstrap class app.ts.
 */
interface Segment {
  duration: number;
  startTime: number;
  url: string;
  timestamp?: string;
}

// Interface for parsed M3U8 data
interface M3U8Data {
  segments: Segment[];
  targetDuration: number;
  version: number;
  isEvent: boolean;
}


@injectable()
export class ClipService {

  private UsersRepository: UsersRepository = container.resolve(UsersRepository)
  private ClipRepository: ClipRepository = container.resolve(ClipRepository)

  public _thumbnailService: ThumbnailService = new ThumbnailService;
  private _uploadBunkrService: UploadBunkrService = container.resolve(UploadBunkrService)


  public createClip = async (timestamp: string, timestamp_end: string, live_id: string, userId: string): Promise<string> => {
    try {
      //return await this.UsersRepository.find(EntityType, { select: { id: true, identity: true, cpo: true } })

      const clip_data = await this.ClipRepository.getDataForClip(live_id)
      if (clip_data) {
        const clip = new Clip(/*clip_data, userId*/);
        clip.userId = userId
        clip.live_id = live_id
        clip.streamer_id = clip_data.streamer_id
        clip.streamer = clip_data.streamer
        clip.country = clip_data.country
        clip.tittle = clip_data.tittle
        clip.platform = clip_data.platform
        clip.tags = clip_data.tags

        const clip_id = await this.ClipRepository.saveClip(clip)
        console.log(`
          ==============================
          >>>>> CLIP ID ${clip_id} <<<<<
          ==============================
          `)
        const path_clip = PATH_CLIPS + clip_id
        const out_m3u8 = path_clip + '/' + clip_id + '.m3u8'
        const out_m3u8_proxy = path_clip + '/' + clip_id + 'proxy' + '.m3u8'

        await this.createDiretory(path_clip)

        /*const create_clip = */await this.createClipM3U8(clip_id, clip_data.urls, timestamp, timestamp_end, out_m3u8)

        /*const clip_proxy = */await this.createM3U8WithProxy(out_m3u8, out_m3u8_proxy, clip_id)

        return clip_id
        // DEPPOIS SAVE CLIP
      }
      return '';
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async createDiretory(name: string): Promise<void> {
    fs_sync.mkdir(name, { recursive: true }, (error) => {
      if (error) {
        return
      }
    });
  }

  /*async parseTimeToSeconds(timeStr: string): Promise<number> {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }*/
  private async parseTimeToSeconds(timeInput: string): Promise<number> {
    // Se já for um número (segundos), retorna diretamente
    if (!isNaN(Number(timeInput))) {
      return Number(timeInput);
    }

    // Se for formato HH:MM:SS ou MM:SS
    const timeParts = timeInput.split(':').map(part => parseInt(part, 10));

    if (timeParts.length === 3) {
      // HH:MM:SS
      const [hours, minutes, seconds] = timeParts;
      return hours * 3600 + minutes * 60 + seconds;
    } else if (timeParts.length === 2) {
      // MM:SS
      const [minutes, seconds] = timeParts;
      return minutes * 60 + seconds;
    } else if (timeParts.length === 1) {
      // SS
      return timeParts[0];
    }

    throw new Error(`Invalid time format: ${timeInput}. Expected HH:MM:SS, MM:SS, or seconds`);
  }
  private formatSecondsToTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  // Function to format a Date object to ISO 8601 with -0300 offset
  async formatTimestamp(date: Date): Promise<string> {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());
    const millis = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}-0300`;
  }

  async parseM3U8(m3u8FilePath: string): Promise<M3U8Data> {
    const lines = m3u8FilePath.split('\n');
    const segments: Segment[] = [];
    let currentSegment: Partial<Segment> | null = null;
    let targetDuration: number = 0;
    let version: number = 3; // Default HLS version
    let isEvent: boolean = false;
    let currentTime: number = 0; // Track cumulative time for segments

    for (const line of lines) {
      if (line.startsWith('#EXT-X-TARGETDURATION:')) {
        targetDuration = parseInt(line.match(/#EXT-X-TARGETDURATION:(\d+)/)![1], 10);
      } else if (line.startsWith('#EXT-X-VERSION:')) {
        version = parseInt(line.match(/#EXT-X-VERSION:(\d+)/)![1], 10);
      } else if (line.startsWith('#EXT-X-PLAYLIST-TYPE:EVENT')) {
        isEvent = true;
      } else if (line.startsWith('#EXTINF:')) {
        const duration = parseFloat(line.match(/#EXTINF:([\d.]+)/)![1]);
        currentSegment = { duration, startTime: currentTime };
        // CORREÇÃO: currentTime deve ser incrementado DEPOIS de criar o segmento
        // currentTime += duration; // ← MOVER PARA DEPOIS
      } else if (line.startsWith('#EXT-X-PROGRAM-DATE-TIME:')) {
        if (currentSegment) {
          currentSegment.timestamp = line.replace('#EXT-X-PROGRAM-DATE-TIME:', '');
        }
      } else if (line.match(/\.ts$/)) {
        if (currentSegment) {
          currentSegment.url = line.trim();
          segments.push(currentSegment as Segment);
          
          // CORREÇÃO: Incrementar currentTime APÓS adicionar o segmento
          currentTime += Number(currentSegment.duration);
          
          currentSegment = null;
        }
      }
    }

    console.log(`Parsed ${segments.length} segments from M3U8`);
    
    // DEBUG: Adicionar logs para verificar os tempos
    console.log('=== PRIMEIROS 5 SEGMENTOS ===');
    segments.slice(0, 5).forEach((seg, i) => {
      console.log(`Segmento ${i}: startTime=${seg.startTime}, duration=${seg.duration}, endTime=${seg.startTime + seg.duration}`);
    });
    
    return { segments, targetDuration, version, isEvent };
}

  // Function to parse M3U8 file and extract segments
  async parseM3U8_old(m3u8FilePath: string): Promise<M3U8Data> {
    //const content = await fs.readFile(m3u8FilePath, 'utf-8');
    //const lines = content.split('\n');
    const lines = m3u8FilePath.split('\n');
    const segments: Segment[] = [];
    let currentSegment: Partial<Segment> | null = null;
    let targetDuration: number = 0;
    let version: number = 3; // Default HLS version
    let isEvent: boolean = false;
    let currentTime: number = 0; // Track cumulative time for segments

    for (const line of lines) {
      if (line.startsWith('#EXT-X-TARGETDURATION:')) {
        targetDuration = parseInt(line.match(/#EXT-X-TARGETDURATION:(\d+)/)![1], 10);
      } else if (line.startsWith('#EXT-X-VERSION:')) {
        version = parseInt(line.match(/#EXT-X-VERSION:(\d+)/)![1], 10);
      } else if (line.startsWith('#EXT-X-PLAYLIST-TYPE:EVENT')) {
        isEvent = true;
      } else if (line.startsWith('#EXTINF:')) {
        const duration = parseFloat(line.match(/#EXTINF:([\d.]+)/)![1]);
        currentSegment = { duration, startTime: currentTime };
        currentTime += duration;
      } else if (line.startsWith('#EXT-X-PROGRAM-DATE-TIME:')) {
        if (currentSegment) {
          currentSegment.timestamp = line.replace('#EXT-X-PROGRAM-DATE-TIME:', '');
        }
      } else if (line.match(/\.ts$/)) {
        if (currentSegment) {
          currentSegment.url = line.trim();
          segments.push(currentSegment as Segment);
          currentSegment = null;
        }
      }
    }

    console.log(`Parsed ${segments.length} segments from M3U8`);
    return { segments, targetDuration, version, isEvent };
  }

  async selectClipSegments(segments: Segment[], inputTimeSeconds: number): Promise<{
    selectedSegments: Segment[];
    startOffset: number;
    totalDuration: number;
  }> {
    const clipDuration = 30; // 30-second clip
    let startTimeSeconds = Math.max(0, inputTimeSeconds - clipDuration); // Start 30 seconds before, not negative
    const endTimeSeconds = inputTimeSeconds; // End at input time

    const selectedSegments: Segment[] = [];
    let totalDuration: number = 0;
    let startOffset: number = 0;
    let foundStart: boolean = false;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentStart = segment.startTime;
      const segmentEnd = segment.startTime + segment.duration;

      // Find the start offset for the first segment
      if (!foundStart && startTimeSeconds >= segmentStart && startTimeSeconds < segmentEnd) {
        startOffset = startTimeSeconds - segmentStart;
        foundStart = true;
      }

      // Include segments that overlap with the clip window
      if (foundStart && segmentStart < endTimeSeconds) {
        const newSegment: Segment = { ...segment };
        // Adjust duration of the first segment if startOffset is non-zero
        if (startOffset > 0 && selectedSegments.length === 0) {
          newSegment.duration -= startOffset;
          newSegment.startTime = startTimeSeconds;
        }
        // Adjust duration of the last segment if it extends beyond endTime
        if (segmentEnd > endTimeSeconds) {
          newSegment.duration = endTimeSeconds - newSegment.startTime;
        }
        selectedSegments.push(newSegment);
        totalDuration += newSegment.duration;

        if (segmentEnd >= endTimeSeconds) {
          break;
        }
      }
    }

    console.log(`Selected ${selectedSegments.length} segments, total duration: ${totalDuration}s, start offset: ${startOffset}s`);
    return { selectedSegments, startOffset, totalDuration };
  }

  async generateM3U8File(
    clip_id: string,
    m3u8Data: M3U8Data,
    outputFile: string,
    selectedSegments: Segment[],
    startOffset: number
  ): Promise<string> {
    let m3u8Content = '#EXTM3U\n';
    m3u8Content += `#EXT-X-VERSION:${m3u8Data.version}\n`;
    m3u8Content += `#EXT-X-TARGETDURATION:${m3u8Data.targetDuration}\n`;
    m3u8Content += '#EXT-X-MEDIA-SEQUENCE:0\n';
    if (m3u8Data.isEvent) {
      m3u8Content += '#EXT-X-PLAYLIST-TYPE:EVENT\n';
    }
    m3u8Content += '#EXT-X-INDEPENDENT-SEGMENTS\n';
    if (selectedSegments.length > 0 && m3u8Data.segments[0]?.timestamp) {
      m3u8Content += '#EXT-X-DISCONTINUITY\n';
    }
    
    // Base timestamp for relativization (start of clip)
    const baseTime = new Date('2025-05-05T00:00:00.000Z');
    
    // CORREÇÃO PRINCIPAL: O timestamp deve começar do tempo real onde o clip inicia
    // O startOffset NÃO deve ser usado para calcular timestamps, apenas para referência
    let accumulatedDuration = 0;
    
    // Calcular o tempo base real onde o clip começa
    // Isso requer saber o timestamp do primeiro segmento selecionado
    let clipStartTime = 0;
    
    // Se você tem o timestamp absoluto do primeiro segmento, use-o
    // Caso contrário, use uma aproximação baseada no startOffset
    if (selectedSegments[0]?.timestamp) {
      clipStartTime = new Date(selectedSegments[0].timestamp).getTime();
    } else {
      // Aproximação: usar o startOffset para calcular quando o clip deveria começar
      clipStartTime = baseTime.getTime();
    }
    
    for (let i = 0; i < selectedSegments.length; i++) {
      const segment = selectedSegments[i];
      const duration = segment.duration;
      
      // Para o primeiro segmento, ajustar o timestamp baseado no startOffset
      let segmentTimestamp;
      if (i === 0) {
        // O primeiro segmento deve começar exatamente no início do clip
        segmentTimestamp = new Date(clipStartTime);
      } else {
        // Segmentos subsequentes seguem a progressão normal
        segmentTimestamp = new Date(clipStartTime + accumulatedDuration * 1000);
      }
      
      const timestamp = await this.formatTimestamp(segmentTimestamp);
      
      m3u8Content += `#EXTINF:${duration.toFixed(6)},\n`;
      m3u8Content += `#EXT-X-PROGRAM-DATE-TIME:${timestamp}\n`;
      m3u8Content += `${segment.url}\n`;
      
      accumulatedDuration += duration;
    }
    
    m3u8Content += '#EXT-X-ENDLIST\n';
    await fs.writeFile(outputFile, m3u8Content);
    
    // Fazer upload do m3u8 clip
    const upload_m3u8 = await this._uploadBunkrService.uploadClipM3u8(clip_id, outputFile);
    
    return `Output M3U8 written to ${outputFile}`;
}

  async generateM3U8File_3(
    clip_id: string,
    m3u8Data: M3U8Data,
    outputFile: string,
    selectedSegments: Segment[],
    startOffset: number
  ): Promise<string> {
    let m3u8Content = '#EXTM3U\n';
    m3u8Content += `#EXT-X-VERSION:${m3u8Data.version}\n`;
    m3u8Content += `#EXT-X-TARGETDURATION:${m3u8Data.targetDuration}\n`;
    m3u8Content += '#EXT-X-MEDIA-SEQUENCE:0\n';
    if (m3u8Data.isEvent) {
      m3u8Content += '#EXT-X-PLAYLIST-TYPE:EVENT\n';
    }
    m3u8Content += '#EXT-X-INDEPENDENT-SEGMENTS\n';
    if (selectedSegments.length > 0 && m3u8Data.segments[0]?.timestamp) {
      m3u8Content += '#EXT-X-DISCONTINUITY\n';
    }
    
    // Base timestamp for relativization (start of clip)
    const baseTime = new Date('2025-05-05T00:00:00.000Z');
    
    // CORREÇÃO: O clip deve começar no tempo 0, não no startOffset
    // O startOffset é usado apenas para calcular o timestamp base
    const clipBaseTime = new Date(baseTime.getTime() + (startOffset * 1000));
    let currentClipTime = 0; // Sempre começar do zero para o clip
    
    for (let i = 0; i < selectedSegments.length; i++) {
      const segment = selectedSegments[i];
      const duration = segment.duration;
      
      // Calculate relative timestamp baseado no tempo do clip
      const segmentTime = new Date(clipBaseTime.getTime() + currentClipTime);
      const timestamp = await this.formatTimestamp(segmentTime);
      
      m3u8Content += `#EXTINF:${duration.toFixed(6)},\n`;
      m3u8Content += `#EXT-X-PROGRAM-DATE-TIME:${timestamp}\n`;
      m3u8Content += `${segment.url}\n`;
      
      // Increment by segment duration (duration já está em segundos)
      currentClipTime += duration * 1000;
    }
    
    m3u8Content += '#EXT-X-ENDLIST\n';
    await fs.writeFile(outputFile, m3u8Content);
    
    // Fazer upload do m3u8 clip
    const upload_m3u8 = await this._uploadBunkrService.uploadClipM3u8(clip_id, outputFile);
    
    return `Output M3U8 written to ${outputFile}`;
}

  async generateM3U8File_2(
    clip_id: string,
    m3u8Data: M3U8Data,
    outputFile: string,
    selectedSegments: Segment[],
    startOffset: number
  ): Promise<string> {
    let m3u8Content = '#EXTM3U\n';
    m3u8Content += `#EXT-X-VERSION:${m3u8Data.version}\n`;
    m3u8Content += `#EXT-X-TARGETDURATION:${m3u8Data.targetDuration}\n`;
    m3u8Content += '#EXT-X-MEDIA-SEQUENCE:0\n';
    if (m3u8Data.isEvent) {
      m3u8Content += '#EXT-X-PLAYLIST-TYPE:EVENT\n';
    }
    m3u8Content += '#EXT-X-INDEPENDENT-SEGMENTS\n';
    if (selectedSegments.length > 0 && m3u8Data.segments[0]?.timestamp) {
      m3u8Content += '#EXT-X-DISCONTINUITY\n';
    }

    // Base timestamp for relativization (start of clip)
    const baseTime = new Date('2025-05-05T00:00:00.000Z');
    let currentClipTime = -startOffset * 1000; // Adjust for start offset in milliseconds

    for (let i = 0; i < selectedSegments.length; i++) {
      const segment = selectedSegments[i];
      const duration = segment.duration;
      // Calculate relative timestamp
      const segmentTime = new Date(baseTime.getTime() + currentClipTime);
      const timestamp = await this.formatTimestamp(segmentTime);
      m3u8Content += `#EXTINF:${duration.toFixed(6)},\n`;
      m3u8Content += `#EXT-X-PROGRAM-DATE-TIME:${timestamp}\n`;
      m3u8Content += `${segment.url}\n`;
      currentClipTime += duration * 1000; // Increment by segment duration
    }

    m3u8Content += '#EXT-X-ENDLIST\n';

    await fs.writeFile(outputFile, m3u8Content);

    //fazer upload do m3u8 clip
    const upload_m3u8 = await this._uploadBunkrService.uploadClipM3u8(clip_id, outputFile)
    return `Output M3U8 written to ${outputFile}`;
  }

  async generateM3U8File_1(
    clip_id: string,
    m3u8Data: M3U8Data,
    outputFile: string,
    selectedSegments: Segment[],
    startOffset: number,
    endTimeSeconds?: number,
    inputTimeSeconds?: number
  ): Promise<string> {
    let m3u8Content = '#EXTM3U8\n';
    m3u8Content += `#EXT-X-VERSION:${m3u8Data.version}\n`;
    m3u8Content += `#EXT-X-TARGETDURATION:${m3u8Data.targetDuration}\n`;
    m3u8Content += '#EXT-X-MEDIA-SEQUENCE:0\n';

    if (m3u8Data.isEvent) {
      m3u8Content += '#EXT-X-PLAYLIST-TYPE:EVENT\n';
    }

    m3u8Content += '#EXT-X-INDEPENDENT-SEGMENTS\n';

    if (selectedSegments.length > 0 && m3u8Data.segments[0]?.timestamp) {
      m3u8Content += '#EXT-X-DISCONTINUITY\n';
    }

    // Base timestamp for relativization (start of clip)
    const baseTime = new Date('2025-05-05T00:00:00.000Z');
    let currentClipTime = -startOffset * 1000; // Adjust for start offset in milliseconds
    let totalProcessedTime = 0;

    for (let i = 0; i < selectedSegments.length; i++) {
      const segment = selectedSegments[i];
      let segmentDuration = segment.duration;

      // Adjust duration for first segment if we start mid-segment
      if (i === 0 && startOffset > 0) {
        segmentDuration = Math.max(0, segmentDuration - startOffset);
      }

      // Adjust duration for last segment if we need to cut it short
      if (endTimeSeconds && inputTimeSeconds) {
        const clipDuration = endTimeSeconds - inputTimeSeconds;
        const remainingClipTime = clipDuration - totalProcessedTime;

        if (remainingClipTime < segmentDuration) {
          segmentDuration = Math.max(0, remainingClipTime);
        }
      }

      // Skip if segment duration is too small
      if (segmentDuration <= 0.001) {
        continue;
      }

      // Calculate relative timestamp
      const segmentTime = new Date(baseTime.getTime() + currentClipTime);
      const timestamp = await this.formatTimestamp(segmentTime);

      m3u8Content += `#EXTINF:${segmentDuration.toFixed(6)},\n`;
      m3u8Content += `#EXT-X-PROGRAM-DATE-TIME:${timestamp}\n`;
      m3u8Content += `${segment.url}\n`;

      currentClipTime += segmentDuration * 1000; // Increment by actual segment duration
      totalProcessedTime += segmentDuration;

      // Stop if we've reached the desired clip duration
      if (endTimeSeconds && inputTimeSeconds) {
        const clipDuration = endTimeSeconds - inputTimeSeconds;
        if (totalProcessedTime >= clipDuration) {
          break;
        }
      }
    }

    m3u8Content += '#EXT-X-ENDLIST\n';

    await fs.writeFile(outputFile, m3u8Content);

    // Fazer upload do m3u8 clip
    const upload_m3u8 = await this._uploadBunkrService.uploadClipM3u8(clip_id, outputFile);

    console.log(`Clip M3U8 generated: ${totalProcessedTime.toFixed(2)} seconds`);
    return `Output M3U8 written to ${outputFile}`;
  }


  public async createClipM3U8_2(clip_id: string, m3u8FileUrl: string, inputTime: string, endTime: string, outputFile: string): Promise<void> {
    try {
      // Parse input time (HH:MM:SS) to seconds
      const inputTimeSeconds = await this.parseTimeToSeconds(inputTime);
      if (inputTimeSeconds < 0) {
        throw new Error('Input time must be non-negative');
      }

      //BAIXE O M3U8
      const response = await fetch(`${config.PROXY_BUNNY}?url=` + m3u8FileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch M3U8: ${response.status} ${response.statusText}`);
      }
      const m3u8Content = await response.text();

      // Parse M3U8
      const m3u8Data = await this.parseM3U8(m3u8Content);

      const { segments, targetDuration, version, isEvent } = m3u8Data;

      // Select segments for the 30-second clip
      const { selectedSegments, startOffset, totalDuration } = await this.selectClipSegments(segments, inputTimeSeconds);

      if (selectedSegments.length === 0) {
        throw new Error('No segments selected for the clip');
      }

      // Generate the M3U8 file with relativized timestamps
      const result = await this.generateM3U8File(clip_id, m3u8Data, outputFile, selectedSegments, startOffset);

      console.log(result);
    } catch (err) {
      console.error('Error: createClipM3U8', (err as Error).message);
    }
  }

  public async createClipM3U8(clip_id: string, m3u8FileUrl: string, inputTime: string, endTime: string, outputFile: string): Promise<void> {
    try {
      // Parse input time and end time (HH:MM:SS) to seconds
      const inputTimeSeconds = await this.parseTimeToSeconds(inputTime);
      const endTimeSeconds = await this.parseTimeToSeconds(endTime);

      // Validate times
      if (inputTimeSeconds < 0) {
        throw new Error('Input time must be non-negative');
      }
      if (endTimeSeconds < 0) {
        throw new Error('End time must be non-negative');
      }
      if (endTimeSeconds <= inputTimeSeconds) {
        throw new Error('End time must be greater than input time');
      }

      const clipDuration = endTimeSeconds - inputTimeSeconds;
      console.log(`Creating clip from ${inputTime} to ${endTime} (${clipDuration} seconds)`);

      // BAIXE O M3U8
      const response = await fetch(`${config.PROXY_BUNNY}?url=` + m3u8FileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch M3U8: ${response.status} ${response.statusText}`);
      }
      const m3u8Content = await response.text();

      // Parse M3U8
      const m3u8Data = await this.parseM3U8(m3u8Content);
      const { segments/*, targetDuration, version, isEvent*/} = m3u8Data;

      // Select segments for the custom duration clip
      const { selectedSegments, startOffset, totalDuration } = await this.selectClipSegmentsWithDuration(
        segments,
        inputTimeSeconds,
        endTimeSeconds
      );

      if (selectedSegments.length === 0) {
        throw new Error('No segments selected for the clip');
      }

      console.log(`Selected ${selectedSegments.length} segments for ${totalDuration.toFixed(2)} seconds clip`);

      // Generate the M3U8 file with relativized timestamps
      const result = await this.generateM3U8File(clip_id, m3u8Data, outputFile, selectedSegments, startOffset);

      console.log(result);
    } catch (err) {
      console.error('Error: createClipM3U8', (err as Error).message);
      throw err; // Re-throw to handle in calling code
    }
  }

  // Nova função para selecionar segmentos com duração customizada
  private async selectClipSegmentsWithDuration(
    segments: Segment[],
    startTimeSeconds: number,
    endTimeSeconds: number
  ): Promise<{ selectedSegments: Segment[]; startOffset: number; totalDuration: number }> {
    const selectedSegments: Segment[] = [];
    let currentTime = 0;
    let startOffset = 0;
    let totalDuration = 0;
    let clipStarted = false;

    const clipDuration = endTimeSeconds - startTimeSeconds;

    for (const segment of segments) {
      const segmentStart = currentTime;
      const segmentEnd = currentTime + segment.duration;

      // Check if this segment intersects with our clip timeframe
      if (segmentEnd > startTimeSeconds && segmentStart < endTimeSeconds) {
        if (!clipStarted) {
          clipStarted = true;
          // Calculate offset within the first segment
          startOffset = Math.max(0, startTimeSeconds - segmentStart);
        }

        selectedSegments.push(segment);

        // Calculate how much of this segment contributes to the clip
        const clipSegmentStart = Math.max(segmentStart, startTimeSeconds);
        const clipSegmentEnd = Math.min(segmentEnd, endTimeSeconds);
        const segmentContribution = clipSegmentEnd - clipSegmentStart;

        totalDuration += segmentContribution;

        // Stop if we've reached the end time
        if (segmentEnd >= endTimeSeconds) {
          break;
        }
      }

      currentTime += segment.duration;

      // Stop if we've passed the end time
      if (currentTime >= endTimeSeconds) {
        break;
      }
    }

    return { selectedSegments, startOffset, totalDuration };
  }

  async createM3U8WithProxy(inputm3u8: string, outputm3u8: string, clip_id: string): Promise<void> {
    try {
      // Read the input M3U8 file
      const content = await fs.readFile(inputm3u8, 'utf-8');
      const lines = content.split('\n');
      const proxyUrl = `${config.PROXY_BUNNY}?url=`;

      // Process each line, modifying .ts chunk URLs
      const modifiedLines = lines.map((line) => {
        if (line.trim().match(/\.ts$/)) {
          // URL-encode the original .ts URL and prepend the proxy URL
          const encodedUrl = encodeURIComponent(line.trim());
          return `${proxyUrl}${encodedUrl}`;
        }
        // Preserve non-chunk lines (e.g., #EXTINF, #EXT-X-TARGETDURATION)
        return line;
      });

      // Join the modified lines and write to the output M3U8 file
      const modifiedContent = modifiedLines.join('\n');
      await fs.writeFile(outputm3u8, modifiedContent);

      await this._thumbnailService.createThumbnailM3U8Clip(outputm3u8, outputm3u8 + '.jpg', clip_id)

      console.log(`Modified M3U8 written to ${outputm3u8}`);
    } catch (err) {
      console.error('Error:', (err as Error).message);
      throw err; // Re-throw to allow caller to handle
    }
  }

  async updateStreamUrls(URLS: string, live_id: string): Promise<any> {
    console.log("UPDATRE STREAM COM URL:", URLS)

    const updateStream = await this.ClipRepository.updateStreamUrls(live_id, URLS);

    if (updateStream) {
      return;
    } else {
      return;
    }
  }

  async waitForFile(filePath: string, timeout: number = 60000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        await fsPromises.access(filePath);
        console.log(`Arquivo encontrado: ${filePath}`);
        return true;
      } catch (error) {
        // Arquivo ainda não existe, espere um pouco
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.error(`Timeout: Arquivo não encontrado após ${timeout}ms: ${filePath}`);
    return false;
  }
  async deleteSpecificFile(filePath) {
    try {
      await unlink(filePath);
      console.log(`Arquivo "${filePath}" deletado com sucesso.`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`Arquivo "${filePath}" não encontrado, nada a deletar.`);
      } else {
        console.error(`Erro ao deletar o arquivo "${filePath}":`, error);
      }
    }
  }
}