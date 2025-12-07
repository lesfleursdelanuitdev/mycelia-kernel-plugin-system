<script>
  import { onMount, onDestroy } from 'svelte';
  import { setMyceliaSystem } from '../../../src/svelte/index.js';
  import { buildTodoSystem } from '../../todo-shared/src/system.builder.js';
  import TodoApp from './components/TodoApp.svelte';

  let system;
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      system = await buildTodoSystem('svelte-todo-app');
      setMyceliaSystem(system);
      loading = false;
    } catch (err) {
      error = err;
      loading = false;
      console.error('Failed to build system:', err);
    }
  });

  onDestroy(async () => {
    if (system) {
      await system.dispose();
    }
  });
</script>

{#if loading}
  <div>Loading Todo system…</div>
{:else if error}
  <div>Error: {error.message}</div>
{:else}
  <TodoApp />
{/if}

