/**
 * Queue abstraction for DSP processing jobs.
 * Currently uses direct HTTP POST to the Python worker.
 * Can be upgraded to BullMQ/Redis when needed for higher throughput.
 */

export interface DspJob {
  releaseId: string;
  mediaAssetId: string;
  audioKey?: string;
  videoKey?: string;
  auxKeys?: {
    midi?: string;
    musicxml?: string;
    webvtt?: string;
    srt?: string;
  };
}

export async function enqueueDspJob(job: DspJob): Promise<void> {
  const workerUrl = process.env.WORKER_URL || 'http://localhost:8000';
  const webhookSecret = process.env.WORKER_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('WORKER_WEBHOOK_SECRET is not configured');
  }

  const response = await fetch(`${workerUrl}/jobs/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': webhookSecret,
    },
    body: JSON.stringify(job),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Worker rejected job: ${response.status} ${text}`);
  }
}
