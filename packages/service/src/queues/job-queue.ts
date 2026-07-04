import PQueue from "p-queue";
import type { Job } from "./job.types";

const CONCURRENCY = parseInt(process.env.JOB_CONCURRENCY ?? "5", 10);

class JobQueue {
  private queue: PQueue;

  constructor() {
    this.queue = new PQueue({
      concurrency: CONCURRENCY,
      autoStart: true,
    });
  }

  add(job: Job): void {
    this.queue.add(() => Promise.resolve(job));
  }

  async addAndWait(job: Job): Promise<void> {
    await this.queue.add(() => Promise.resolve(job));
  }

  get size(): number {
    return this.queue.size;
  }

  get pending(): number {
    return this.queue.pending;
  }

  onIdle(): Promise<unknown> {
    return this.queue.onIdle();
  }

  clear(): void {
    this.queue.clear();
  }
}

export const jobQueue = new JobQueue();
