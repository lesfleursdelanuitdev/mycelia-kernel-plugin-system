/**
 * TodoList Component
 * 
 * Displays a list of todos.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Todo } from './todo-app.component';

@Component({
  selector: 'app-todo-list',
  template: `
    <p *ngIf="!items.length" class="empty">Nothing here yet.</p>
    <ul *ngIf="items.length" class="todo-list">
      <app-todo-item
        *ngFor="let todo of items; trackBy: trackByTodoId"
        [todo]="todo"
        (toggle)="onToggle.emit($event)"
        (remove)="onRemove.emit($event)"
      ></app-todo-item>
    </ul>
  `,
  styles: [`
    .todo-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .empty {
      text-align: center;
      color: #999;
      padding: 20px;
    }
  `]
})
export class TodoListComponent {
  @Input() items: Todo[] = [];
  @Output() toggle = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  trackByTodoId(index: number, todo: Todo): string {
    return todo.id;
  }
}


