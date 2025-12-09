<script>
  import TodoItem from './TodoItem.svelte';

  export let items;
  export let onToggle;
  export let onRemove;
</script>

{#if !items.length}
  <p class="empty">Nothing here yet.</p>
{:else}
  <ul class="todo-list">
    {#each items as todo (todo.id)}
      <TodoItem
        {todo}
        onToggle={() => onToggle(todo.id)}
        onRemove={() => onRemove(todo.id)}
      />
    {/each}
  </ul>
{/if}




