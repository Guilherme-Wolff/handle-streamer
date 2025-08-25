import { ChildProcessWithoutNullStreams } from 'child_process';

export interface Process {
    streamer?:string;
    status?: string;
    process: ChildProcessWithoutNullStreams;
    id: string;
  }
  