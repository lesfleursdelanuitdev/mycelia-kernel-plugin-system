/**
 * TodoApp Component
 * 
 * Main component that orchestrates the todo application.
 * Demonstrates using Mycelia Angular bindings for state management.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { MyceliaService } from '../services/mycelia.service';
import { TodosService } from '../services/todos.service';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

@Component({
  selector: 'app-todo-app',
  template: `
    <div class="todo-app">
      <h1>Mycelia Angular Todo</h1>
      <app-todo-input (add)="onAdd($event)"></app-todo-input>
      <app-todo-list
        [items]="items$ | async"
        (toggle)="onToggle($event)"
        (remove)="onRemove($event)"
      ></app-todo-list>
      <footer>
        <button (click)="onClearCompleted()">Clear completed</button>
        <span>{{ activeCount$ | async }} items left</span>
      </footer>
    </div>
  `,
  styles: [`
    .todo-app {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    footer {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `]
})
export class TodoAppComponent implements OnInit, OnDestroy {
  items$ = new BehaviorSubject<Todo[]>([]);
  activeCount$: Observable<number>;
  private unsubscribeListener: (() => void) | null = null;
  private todosFacet: any = null;

  constructor(
    private mycelia: MyceliaService,
    private todos: TodosService
  ) {
    this.activeCount$ = this.items$.pipe(
      map(items => items.filter(t => !t.completed).length)
    );
  }

  ngOnInit() {
    const system = this.mycelia.getSystem();
    
    // Enable listeners when system is ready
    if (system && system.listeners) {
      system.listeners.enableListeners();
    }

    // Get todos facet
    this.todosFacet = this.todos.getTodosFacet();
    
    // Initialize items
    if (this.todosFacet) {
      this.items$.next(this.todosFacet.getAll());
    }

    // Subscribe to todos:changed events
    this.unsubscribeListener = this.mycelia.useListener(
      'todos:changed',
      (msg: any) => {
        this.items$.next(msg.body.items);
      }
    );

    // Also subscribe to system changes
    this.mycelia.system$.subscribe(system => {
      if (system) {
        const todos = system.find?.('todos');
        if (todos) {
          this.todosFacet = todos;
          this.items$.next(todos.getAll());
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
    }
  }

  onAdd(text: string) {
    if (this.todosFacet) {
      this.todosFacet.add(text);
    }
  }

  onToggle(id: string) {
    if (this.todosFacet) {
      this.todosFacet.toggle(id);
    }
  }

  onRemove(id: string) {
    if (this.todosFacet) {
      this.todosFacet.remove(id);
    }
  }

  onClearCompleted() {
    if (this.todosFacet) {
      this.todosFacet.clearCompleted();
    }
  }
}

