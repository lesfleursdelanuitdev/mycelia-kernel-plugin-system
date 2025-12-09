/**
 * App Component
 * 
 * Root component that initializes the Mycelia system.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { MyceliaService } from './services/mycelia.service';
import { buildTodoSystem } from '../../todo-shared/src/system.builder.js';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="loading" class="loading">Loading Todo system…</div>
    <div *ngIf="error" class="error">Error: {{ error.message }}</div>
    <app-todo-app *ngIf="!loading && !error"></app-todo-app>
  `,
  styles: [`
    .loading, .error {
      padding: 20px;
      text-align: center;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  loading = true;
  error: Error | null = null;

  constructor(private mycelia: MyceliaService) {}

  async ngOnInit() {
    try {
      // Initialize Mycelia system
      await this.mycelia.initialize(buildTodoSystem);
      this.loading = false;
    } catch (err) {
      this.error = err as Error;
      this.loading = false;
      console.error('Failed to build system:', err);
    }
  }

  async ngOnDestroy() {
    await this.mycelia.dispose();
  }
}

