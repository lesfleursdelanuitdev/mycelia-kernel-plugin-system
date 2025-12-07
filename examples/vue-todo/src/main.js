/**
 * Main entry point for Vue Todo App
 * 
 * Sets up the Vue app with MyceliaPlugin.
 */

import { createApp } from 'vue';
import { MyceliaPlugin } from '../../../src/vue/index.js';
import { buildTodoSystem } from '../../todo-shared/src/system.builder.js';
import App from './vue/App.vue';

const app = createApp(App);

// Install Mycelia plugin with the todo system builder
app.use(MyceliaPlugin, { 
  build: () => buildTodoSystem('vue-todo-app')
});

app.mount('#app');

