<script>
  import { onMount } from 'svelte';
  import { useMycelia, useListener } from '../../../src/svelte/index.js';
  import { useTodos } from '../stores/todos.js';
  import TodoInput from './TodoInput.svelte';
  import TodoList from './TodoList.svelte';

  const systemStore = useMycelia();
  const todosStore = useTodos();
  
  $: system = $systemStore;
  $: todosFacet = $todosStore;
  
  let items = [];
  
  // Enable listeners when system is ready
  onMount(() => {
    if (system?.listeners) {
      system.listeners.enableListeners();
    }
    
    // Initial load
    if (todosFacet) {
      items = todosFacet.getAll();
    }
  });
  
  // Listen for changes
  useListener('todos:changed', (msg) => {
    items = msg.body.items;
  });
  
  // Reactive updates when facet changes
  $: {
    if (todosFacet) {
      items = todosFacet.getAll();
    }
  }
  
  $: activeCount = items.filter(t => !t.completed).length;
</script>

<div class="todo-app">
  <h1>Mycelia Svelte Todo</h1>
  <TodoInput onAdd={todosFacet?.add} />
  <TodoList {items} onToggle={todosFacet?.toggle} onRemove={todosFacet?.remove} />
  <footer>
    <button on:click={() => todosFacet?.clearCompleted()}>
      Clear completed
    </button>
    <span>{activeCount} items left</span>
  </footer>
</div>




