// src/shared/DomainEvent.ts

export interface DomainEventPayload {
  [key: string]: unknown;
}

export class DomainEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly type: string,
    public readonly payload: DomainEventPayload,
  ) {
    this.occurredAt = new Date();
  }
}

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public pullEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
