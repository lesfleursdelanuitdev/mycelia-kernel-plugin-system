<script>
  export let todo;
  export let onToggle;
  export let onRemove;
</script>

<li class="todo-item" class:completed={todo.completed}>
  <label>
    <input
      type="checkbox"
      checked={todo.completed}
      on:change={onToggle}
    />
    <span>{todo.text}</span>
  </label>
  <button
    on:click={onRemove}
    aria-label="Remove todo"
    class="remove-button"
  >
    ×
  </button>
</li>




