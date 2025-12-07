<template>
  <form @submit.prevent="handleSubmit">
    <input
      type="text"
      placeholder="What needs to be done?"
      v-model="value"
      class="todo-input"
    />
  </form>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  onAdd: {
    type: Function,
    required: true
  }
});

const value = ref('');

const handleSubmit = () => {
  const text = value.value.trim();
  if (!text) return;
  props.onAdd(text);
  value.value = '';
};
</script>

