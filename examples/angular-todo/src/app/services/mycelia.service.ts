/**
 * Mycelia Service
 * 
 * Angular service that wraps the Mycelia Plugin System.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createMyceliaService } from '../../../../src/angular/index.js';

@Injectable({ providedIn: 'root' })
export class MyceliaService {
  private service: ReturnType<typeof createMyceliaService> | null = null;
  private systemSubject = new BehaviorSubject<any>(null);
  private errorSubject = new BehaviorSubject<Error | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  system$: Observable<any> = this.systemSubject.asObservable();
  error$: Observable<Error | null> = this.errorSubject.asObservable();
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  async initialize(build: () => Promise<any>) {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      this.service = createMyceliaService(build);
      
      // Subscribe to service observables
      this.service.system$.subscribe(system => {
        this.systemSubject.next(system);
        if (system) {
          this.loadingSubject.next(false);
        }
      });

      this.service.error$.subscribe(error => {
        this.errorSubject.next(error);
        if (error) {
          this.loadingSubject.next(false);
        }
      });

      this.service.loading$.subscribe(loading => {
        this.loadingSubject.next(loading);
      });
    } catch (err) {
      this.errorSubject.next(err as Error);
      this.loadingSubject.next(false);
      throw err;
    }
  }

  getSystem() {
    return this.service?.getSystem() ?? null;
  }

  useFacet(kind: string) {
    return this.service?.useFacet(kind) ?? null;
  }

  useListener(eventName: string, handler: Function) {
    return this.service?.useListener(eventName, handler) ?? () => {};
  }

  async dispose() {
    if (this.service) {
      await this.service.dispose();
      this.service = null;
      this.systemSubject.next(null);
      this.errorSubject.next(null);
      this.loadingSubject.next(false);
    }
  }
}

