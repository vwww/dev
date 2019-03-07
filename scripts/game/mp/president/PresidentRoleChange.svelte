<script lang="ts">
import type { PresidentRole } from './PresidentGame.svelte'

import { roleName, roleBadgeClass } from './PresidentRole.svelte'

interface Props {
  name: string
  isMe?: boolean
  prevRole: PresidentRole
  newRole: PresidentRole
}

const { name, isMe, prevRole, newRole }: Props = $props()
</script>

<span class={roleBadgeClass(prevRole, isMe)}>
  {name}
  {#if prevRole != newRole}
    <!-- hide old rank name if it was neutral -->
    {#if prevRole}
      {roleName(prevRole)}
    {/if}

    {prevRole < newRole ? '➚' /* &#10138; &#x279A; */ : '➘' /* &#10136; &#x2798; */}
  {/if}
  {#if prevRole != newRole || newRole}
    <span class={roleBadgeClass(newRole, isMe)}>{roleName(newRole)}</span>
  {/if}
</span>
