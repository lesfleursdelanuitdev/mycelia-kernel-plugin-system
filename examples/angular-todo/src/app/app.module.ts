/**
 * App Module
 * 
 * Angular module configuration.
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { TodoAppComponent } from './components/todo-app.component';
import { TodoInputComponent } from './components/todo-input.component';
import { TodoListComponent } from './components/todo-list.component';
import { TodoItemComponent } from './components/todo-item.component';

@NgModule({
  declarations: [
    AppComponent,
    TodoAppComponent,
    TodoInputComponent,
    TodoListComponent,
    TodoItemComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }


