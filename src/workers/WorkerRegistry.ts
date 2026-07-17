import { DomainEvent } from '../../packages/contracts/events';

export interface BackgroundWorker {
  name: string;
  handleEvent(event: DomainEvent): Promise<void>;
}

export class WorkerRegistry {
  private workers: BackgroundWorker[] = [];

  register(worker: BackgroundWorker) {
    this.workers.push(worker);
  }

  async dispatch(event: DomainEvent): Promise<void> {
    for (const worker of this.workers) {
      // In production, this pushes to a Redis queue like BullMQ
      // For now, we simulate async background processing
      setTimeout(() => {
        worker.handleEvent(event).catch(e => {
          console.error(`Worker [${worker.name}] failed on event ${event.type}:`, e.message);
        });
      }, 0);
    }
  }
}
