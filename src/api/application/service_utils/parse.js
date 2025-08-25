import fs from 'fs'
import axios from "axios"

export function parseM3U8Data(data) {
    const lines = data.trim().split('\n');
    let resolutions = {
        resolutionsOptions:[],
    };

    let currentResolution = '';
    for (const line of lines) {
        if (line.startsWith('#EXT-X-STREAM-INF')) {
            const resolutionMatch = /RESOLUTION=(\d+x\d+)/.exec(line);
            if (resolutionMatch) {
                currentResolution = resolutionMatch[1];
                resolutions.resolutionsOptions.push(currentResolution)
            }
        } else if (line.startsWith('https://')) {
            resolutions[currentResolution] = line;
            currentResolution = '';
        }
    }

    return resolutions;
}

