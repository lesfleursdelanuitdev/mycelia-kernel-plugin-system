<template>
  <li :class="['todo-item', { completed: todo.completed }]">
    <label>
      <input
        type="checkbox"
        :checked="todo.completed"
        @change="onToggle"
      />
      <span>{{ todo.text }}</span>
    </label>
    <button
      @click="onRemove"
      aria-label="Remove todo"
      class="remove-button"
    >
      ×
    </button>
  </li>
</template>

<script setup>
defineProps({
  todo: {
    type: Object,
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




