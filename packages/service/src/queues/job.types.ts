import type {
  Job,
  JobArchive,
  JobPriority,
  JobStatus,
} from "#generated/prisma/client";

export type { Job, JobArchive, JobPriority, JobStatus };

export type JobHandler<_TPayload = unknown, TResult = unknown> = (
  job: Job,
) => Promise<TResult>;

export interface JobWithParsedPayload extends Job {
  payload: unknown;
}

export interface CreateJobInput {
  type: string;
  payload: unknown;
  priority?: JobPriority;
  scheduledAt?: Date;
  maxAttempts?: number;
  timeoutMs?: number;
}

export interface JobFilter {
  status?: JobStatus;
  type?: string;
  limit?: number;
  offset?: number;
}
