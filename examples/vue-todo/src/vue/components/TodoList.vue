<template>
  <p v-if="!items.length" class="empty">Nothing here yet.</p>
  <ul v-else class="todo-list">
    <TodoItem
      v-for="todo in items"
      :key="todo.id"
      :todo="todo"
      :on-toggle="() => onToggle(todo.id)"
      :on-remove="() => onRemove(todo.id)"
    />
  </ul>
</template>

<script setup>
import { TodoItem } from './TodoItem.vue';

defineProps({
  items: {
    type: Array,
    required: true
  },
  onToggle: {
    type: Function,
    required: true
  },
  onRemove: {
    type: Function,
    required: true
  }
});
</script>

