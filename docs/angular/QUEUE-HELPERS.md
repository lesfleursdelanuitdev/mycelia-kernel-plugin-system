# Queue Helpers

Angular utilities for working with the `useQueue` hook in Angular components.

## Overview

The queue helpers provide Angular-friendly ways to monitor queue status and process messages, with RxJS observables for reactive updates.

## useQueueStatus

Get queue status as an RxJS observable.

### API

```ts
useQueueStatus(myceliaService: MyceliaService): Observable<QueueStatus>
```

### Parameters

- **`myceliaService`** (MyceliaService, required): MyceliaService instance

### Returns

- **`status$`** (Observable): Observable that emits queue status objects

### Status Object

```ts
interface QueueStatus {
  size: number;        // Current queue size
  capacity: number;    // Maximum queue capacity
  utilization: number; // Utilization ratio (0-1)
  isFull: boolean;     // Whether queue is full
}
```

### Example

```ts
import { Component } from '@angular/core';
import { useQueueStatus } from 'mycelia-kernel-plugin/angular';

@Component({
  selector: 'app-queue-status',
  template: `
    <div *ngIf="status$ | async as status">
      <p>Queue: {{ status.size }}/{{ status.capacity }}</p>
      <p>Utilization: {{ status.utilization * 100 }}%</p>
      <p *ngIf="status.isFull" class="warning">Queue is full!</p>
    </div>
  `
})
export class QueueStatusComponent {
  status$ = useQueueStatus(this.mycelia);

  constructor(private mycelia: MyceliaService) {}
}
```

## useQueueDrain

Automatically drain queue with message processing.

### API

```ts
useQueueDrain(
  myceliaService: MyceliaService,
  options?: {
    interval?: number;
    onMessage?: (msg: any, options: any) => void;
  }
): Subscription
```

### Parameters

- **`myceliaService`** (MyceliaService, required): MyceliaService instance
- **`options`** (Object, optional): Options object
  - **`interval`** (number, optional): Polling interval in ms. Default: `100`
  - **`onMessage`** (Function, optional): Callback for each message

### Returns

- **`subscription`** (Subscription): RxJS subscription that can be unsubscribed

### Behavior

- **Polling:** Checks for messages at specified interval
- **Processing:** Calls `onMessage` for each message
- **Cleanup:** Must unsubscribe in `ngOnDestroy`

### Example

```ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { useQueueDrain } from 'mycelia-kernel-plugin/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-queue-processor',
  template: `<div>Processing queue...</div>`
})
export class QueueProcessorComponent implements OnInit, OnDestroy {
  private subscription: Subscription | null = null;

  constructor(private mycelia: MyceliaService) {}

  ngOnInit() {
    this.subscription = useQueueDrain(
      this.mycelia,
      {
        interval: 50,
        onMessage: (msg, options) => {
          console.log('Processed message:', msg);
          // Handle message
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
```

## Complete Example

```ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { useQueueStatus, useQueueDrain } from 'mycelia-kernel-plugin/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-queue-dashboard',
  template: `
    <div *ngIf="status$ | async as status">
      <h2>Queue Dashboard</h2>
      <div class="stats">
        <p>Size: {{ status.size }}/{{ status.capacity }}</p>
        <p>Utilization: {{ status.utilization * 100 | number:'1.0-0' }}%</p>
        <p [class.full]="status.isFull">
          Status: {{ status.isFull ? 'Full' : 'Available' }}
        </p>
      </div>
      <div class="processor">
        <p>Processed: {{ processedCount }}</p>
      </div>
    </div>
  `
})
export class QueueDashboardComponent implements OnInit, OnDestroy {
  status$ = useQueueStatus(this.mycelia);
  processedCount = 0;
  private drainSubscription: Subscription | null = null;

  constructor(private mycelia: MyceliaService) {}

  ngOnInit() {
    this.drainSubscription = useQueueDrain(
      this.mycelia,
      {
        interval: 100,
        onMessage: (msg) => {
          this.processedCount++;
          // Process message
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.drainSubscription) {
      this.drainSubscription.unsubscribe();
    }
  }
}
```

## See Also

- [Core Bindings](./CORE-BINDINGS.md) - Service factory and basic utilities
- [useQueue Hook](../hooks/USE-QUEUE.md) - Queue system documentation
- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities


