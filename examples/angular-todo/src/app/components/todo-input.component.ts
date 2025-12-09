/**
 * TodoInput Component
 * 
 * Input component for adding new todos.
 */

import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-todo-input',
  template: `
    <form (ngSubmit)="handleSubmit()">
      <input
        type="text"
        placeholder="What needs to be done?"
        [(ngModel)]="value"
        name="todoInput"
        class="todo-input"
      />
    </form>
  `,
  styles: [`
    .todo-input {
      width: 100%;
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  `]
})
export class TodoInputComponent {
  @Output() add = new EventEmitter<string>();
  value = '';

  handleSubmit() {
    const text = this.value.trim();
    if (!text) return;
    this.add.emit(text);
    this.value = '';
  }
}


