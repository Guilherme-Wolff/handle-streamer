import { spawn } from 'child_process';
import { config } from "../config/index"
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input and output file paths
const inputFile = "C:\\Users\\gabri\\Documents\\projects\\proxy-bunny\\m3u8\\cut.m3u8";
const outputFile = "C:\\Users\\gabri\\Documents\\projects\\proxy-bunny\\m3u8\\b\\clip.m3u8";
const timestamp = "00:00:10";

// Interface for M3U8 segment
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

// Function to parse HH:MM:SS time into seconds
function parseTimeToSeconds(timeStr: string): number {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

// Function to format a Date object to ISO 8601 with -0300 offset
function formatTimestamp(date: Date): string {
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

// Function to parse M3U8 file and extract segments
async function parseM3U8(m3u8FilePath: string): Promise<M3U8Data> {
    const content = await fs.readFile(m3u8FilePath, 'utf-8');
    const lines = content.split('\n');
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

// Function to select segments for the 30-second clip
function selectClipSegments(segments: Segment[], inputTimeSeconds: number): {
    selectedSegments: Segment[];
    startOffset: number;
    totalDuration: number;
} {
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

// Function to generate the output M3U8 file with relativized timestamps
async function generateM3U8File(
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
        const timestamp = formatTimestamp(segmentTime);
        m3u8Content += `#EXTINF:${duration.toFixed(6)},\n`;
        m3u8Content += `#EXT-X-PROGRAM-DATE-TIME:${timestamp}\n`;
        m3u8Content += `${segment.url}\n`;
        currentClipTime += duration * 1000; // Increment by segment duration
    }

    m3u8Content += '#EXT-X-ENDLIST\n';

    await fs.writeFile(outputFile, m3u8Content);
    return `Output M3U8 written to ${outputFile}`;
}

// Main function to create the clip
export async function createClip(m3u8FileUrl: string, inputTime: string, outputFile: string): Promise<void> {
    try {
        // Parse input time (HH:MM:SS) to seconds
        const inputTimeSeconds = parseTimeToSeconds(inputTime);
        if (inputTimeSeconds < 0) {
            throw new Error('Input time must be non-negative');
        }

        //BAIXE O M3U8
        const response = await fetch(config.PROXY_BUNNY + m3u8FileUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch M3U8: ${response.status} ${response.statusText}`);
        }
        const m3u8Content = await response.text();

        // Parse M3U8
        const m3u8Data = await parseM3U8(m3u8Content);

        const { segments, targetDuration, version, isEvent } = m3u8Data;

        // Select segments for the 30-second clip
        const { selectedSegments, startOffset, totalDuration } = selectClipSegments(segments, inputTimeSeconds);

        if (selectedSegments.length === 0) {
            throw new Error('No segments selected for the clip');
        }

        // Generate the M3U8 file with relativized timestamps
        const result = await generateM3U8File(m3u8Data, outputFile, selectedSegments, startOffset);
        console.log(result);
    } catch (err) {
        console.error('Error:', (err as Error).message);
    }
}

// Execute the clip creation
//createClip(inputFile, timestamp, outputFile);