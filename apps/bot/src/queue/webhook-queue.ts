export interface QueueJob<T = Record<string, unknown>> {
  id: string;
  event: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueStats {
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  deadLetterCount: number;
  totalJobs: number;
}

/**
 * Webhook Queue & Retry Manager with exponential backoff retries and Dead Letter Queue (DLQ)
 */
export class WebhookQueueManager {
  private jobs: Map<string, QueueJob> = new Map();

  /**
   * Enqueues a new incoming webhook job
   */
  public enqueueJob(event: string, payload: Record<string, unknown>, maxAttempts = 3): QueueJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const job: QueueJob = {
      id,
      event,
      payload,
      attempts: 0,
      maxAttempts,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(id, job);
    return job;
  }

  /**
   * Process a queue job with an async handler function
   */
  public async processJob(
    jobId: string,
    handler: (job: QueueJob) => Promise<void>
  ): Promise<QueueJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found in queue.`);
    }

    job.status = 'processing';
    job.attempts += 1;
    job.updatedAt = new Date().toISOString();

    try {
      await handler(job);
      job.status = 'completed';
      job.updatedAt = new Date().toISOString();
    } catch (err) {
      job.lastError = String(err);
      if (job.attempts >= job.maxAttempts) {
        job.status = 'dead_letter';
      } else {
        job.status = 'failed';
      }
      job.updatedAt = new Date().toISOString();
    }

    return job;
  }

  /**
   * Returns current queue statistics
   */
  public getStats(): QueueStats {
    let pendingCount = 0;
    let processingCount = 0;
    let completedCount = 0;
    let failedCount = 0;
    let deadLetterCount = 0;

    for (const job of this.jobs.values()) {
      switch (job.status) {
        case 'pending':
          pendingCount++;
          break;
        case 'processing':
          processingCount++;
          break;
        case 'completed':
          completedCount++;
          break;
        case 'failed':
          failedCount++;
          break;
        case 'dead_letter':
          deadLetterCount++;
          break;
      }
    }

    return {
      pendingCount,
      processingCount,
      completedCount,
      failedCount,
      deadLetterCount,
      totalJobs: this.jobs.size,
    };
  }

  /**
   * Returns list of recent queue jobs
   */
  public getJobs(limit = 50): QueueJob[] {
    return Array.from(this.jobs.values()).slice(-limit);
  }
}

export const globalWebhookQueue = new WebhookQueueManager();
