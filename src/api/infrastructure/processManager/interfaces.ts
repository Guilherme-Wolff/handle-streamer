import { ChildProcessWithoutNullStreams } from 'child_process';

export interface Process {
  //parts_counter?: number;
  streamer: string;
  streamer_id:string;
  platform: string;
  status?: boolean;
  urlM3U8: string;
  process?: null | ChildProcessWithoutNullStreams;
  id: string;
  proxyPosition?:number;
  live_id?:string | undefined;
  tittle?:string | undefined;
  country?:string;
}


export interface ProcessStart {
  //parts_counter?: number;
  streamer: string;
  streamer_id:string;
  platform: string;
  status?: boolean;
  urlM3U8?: string;
  //process: ChildProcessWithoutNullStreams;
  id: string;
  proxyPosition?:number;
  live_id?:string;
  tittle?:string | undefined;
}

export interface SegmentMap {
  [segmentName: string]: string;
}

export interface Segment {
  [segmentName: string]: string;
}


/*export class createProcess {
  public status: any
  public process: ChildProcessWithoutNullStreams
  public id: string
  constructor(
    _status: string = "running",
    _process: ChildProcessWithoutNullStreams,
    _id: string,
  ) {
    this.id = _id
    this.process = _process
    this.status = _status
  }
}*/