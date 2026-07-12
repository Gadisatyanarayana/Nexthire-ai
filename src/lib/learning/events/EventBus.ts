import { IDomainEvent } from "../domain/DomainEvents";

export type EventCallback<T extends IDomainEvent> = (event: T) => Promise<void> | void;

export class EventBus {
  private static listeners = new Map<string, EventCallback<any>[]>();

  public static subscribe<T extends IDomainEvent>(
    eventName: string,
    callback: EventCallback<T>
  ): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(callback);
  }

  public static async publish<T extends IDomainEvent>(event: T): Promise<void> {
    const callbacks = this.listeners.get(event.eventName) || [];
    const promises = callbacks.map(callback => {
      try {
        const result = callback(event);
        if (result instanceof Promise) return result;
      } catch (err) {
        console.error(`[EventBus] Error in subscriber for ${event.eventName}:`, err);
      }
      return Promise.resolve();
    });

    await Promise.allSettled(promises);
  }

  public static clear(): void {
    this.listeners.clear();
  }
}
