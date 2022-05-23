<script>
import { afterUpdate } from 'svelte'

export let title = 'Chat'
export let height = '20rem'
export let chatState
export let onInput = console.log

const { messages, queueLength } = chatState

let autoscrollParent
let autoscroll = true

let chatMessage = ''

function checkAutoScroll () {
  const newAutoscroll = autoscrollParent &&
    (autoscrollParent.offsetHeight + autoscrollParent.scrollTop) > (autoscrollParent.scrollHeight - 1)
  if (autoscroll !== newAutoscroll) {
    autoscroll = newAutoscroll
    chatState.setHold(!autoscroll)
  }
}

function doAutoScroll () {
  if (autoscroll) {
    autoscrollParent.scrollTo(0, autoscrollParent.scrollHeight)
  }
}

afterUpdate(doAutoScroll)

function sendInput () {
  onInput(chatMessage)
  chatMessage = ''
}

function handleKeydown (event) {
  if (event.which === 13) {
    sendInput()
  }
}
</script>

<div class="card">
  <div class="card-header">
    <h4 class="float-start">{title}</h4>
    <div class="float-end">
      <button class="btn btn-sm btn-info"
        class:d-none={!$queueLength && autoscroll}
        on:click={() => chatState.setHold(!(autoscroll = true))}>{$queueLength} new</button>
      <button class="btn btn-sm btn-danger"
        class:d-none={!$messages.length}
        on:click={() => chatState.clear()}>Clear</button>
    </div>
  </div>
  <ul
    class="list-group list-group-flush"
    style="overflow-y: scroll; height: {height}"
    on:scroll={checkAutoScroll}
    bind:this={autoscrollParent}>
    {#each $messages as message}
      <li class="list-group-item">
        {#if message.type === 'join'}
          <span><strong>{message.name}</strong> joined the game.</span>
        {:else if message.type === 'left'}
          <span><strong>{message.name}</strong> left the game.</span>
        {:else if message.type === 'reset'}
          <span><strong>{message.name}</strong> reset stats.</span>
        {:else if message.type === 'rename'}
          <span>{message.oldName} is now known as <strong>{message.newName}</strong>.</span>
        {:else if message.type === 'chat'}
          <span>
            {#if message.flags & 4}
              * {message.name}
            {:else}
              <span class="badge bg-secondary">{message.name}</span>
            {/if}
            {#if message.flags & 8}
              <small class="text-muted"><del>{message.msg}</del></small> <span class="text-danger">(do not spam!)</span>
            {:else}
              {message.msg}
            {/if}
            {#if message.targetName}
              (to <span class="badge bg-primary">{message.targetName}</span>)
            {:else if (message.flags & 3) === 2}
              (to <span class="badge bg-info">TEAM</span>)
            {/if}
          </span>
        {:else if message.type === 'sys'}
          <span><em>{message.msg}</em></span>
        {:else}
          <span>{message}</span>
        {/if}
      </li>
    {/each}
    <li class="list-group-item bg-warning text-center" class:d-none={autoscroll}>Scroll down to resume autoscroll</li>
  </ul>
  <div class="card-footer">
    <div class="input-group">
      <input type="text" class="form-control" placeholder="Enter a message here&hellip;" on:keydown={handleKeydown} bind:value={chatMessage}>
      <button class="btn btn-outline-primary" on:click={sendInput}>Send</button>
    </div>
  </div>
</div>
