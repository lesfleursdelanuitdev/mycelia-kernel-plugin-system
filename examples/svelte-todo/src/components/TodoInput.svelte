<script>
  let value = '';

  export let onAdd;

  const handleSubmit = () => {
    const text = value.trim();
    if (!text) return;
    onAdd(text);
    value = '';
  };
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input
    type="text"
    placeholder="What needs to be done?"
    bind:value
    class="todo-input"
  />
</form>

