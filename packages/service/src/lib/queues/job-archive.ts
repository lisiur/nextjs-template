import type { JobRepository } from "#repositories/job.repository";
import type { Job } from "./job.types";

export class JobArchiver {
  constructor(private readonly repository: JobRepository) {}

  async archive(job: Job): Promise<void> {
    await this.repository.archiveAndDelete(job);
  }
}
