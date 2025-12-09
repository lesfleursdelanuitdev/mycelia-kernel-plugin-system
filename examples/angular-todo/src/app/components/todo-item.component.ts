/**
 * TodoItem Component
 * 
 * Individual todo item component.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Todo } from './todo-app.component';

@Component({
  selector: 'app-todo-item',
  template: `
    <li [class.completed]="todo.completed" class="todo-item">
      <label>
        <input
          type="checkbox"
          [checked]="todo.completed"
          (change)="onToggle.emit(todo.id)"
        />
        <span>{{ todo.text }}</span>
      </label>
      <button
        (click)="onRemove.emit(todo.id)"
        aria-label="Remove todo"
        class="remove-button"
      >
        ×
      </button>
    </li>
  `,
  styles: [`
    .todo-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .todo-item.completed span {
      text-decoration: line-through;
      color: #999;
    }
    .remove-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #cc0000;
    }
    .remove-button:hover {
      color: #ff0000;
    }
  `]
})
export class TodoItemComponent {
  @Input() todo!: Todo;
  @Output() toggle = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  get onToggle() {
    return this.toggle;
  }

  get onRemove() {
    return this.remove;
  }
}


