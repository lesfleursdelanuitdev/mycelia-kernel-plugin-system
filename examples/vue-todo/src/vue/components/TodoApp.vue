<template>
  <div v-if="!todosFacet" class="todo-app">
    <div>Loading todos...</div>
  </div>
  <div v-else class="todo-app">
    <h1>Mycelia Vue Todo</h1>
    <TodoInput :on-add="todosFacet.add" />
    <TodoList
      :items="items"
      :on-toggle="todosFacet.toggle"
      :on-remove="todosFacet.remove"
    />
    <footer>
      <button @click="todosFacet.clearCompleted">
        Clear completed
      </button>
      <span>{{ activeCount }} items left</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useListener, useMycelia } from '../../../../src/vue/index.js';
import { useTodosFacet } from '../composables/useTodosFacet.js';
import { TodoInput } from './TodoInput.vue';
import { TodoList } from './TodoList.vue';

const system = useMycelia();
const todosFacet = useTodosFacet();
const items = ref([]);

// Enable listeners when system is ready
onMounted(() => {
  if (system && system.listeners) {
    system.listeners.enableListeners();
  }
  
  // Initialize from facet if available
  if (todosFacet.value) {
    items.value = todosFacet.value.getAll();
  }
});

// Keep local Vue state in sync with events from the plugin system
useListener('todos:changed', (msg) => {
  items.value = msg.body.items;
});

// Update state when facet becomes available
watch(todosFacet, (newFacet) => {
  if (newFacet) {
    items.value = newFacet.getAll();
  }
}, { immediate: true });

const activeCount = computed(() => {
  return items.value.filter((t) => !t.completed).length;
});
</script>

