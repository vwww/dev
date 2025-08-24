<script lang="ts">
import type { PresidentRole } from './PresidentGame.svelte'

interface Props {
  name: string
  isMe?: boolean
  prevRole: PresidentRole
  newRole: PresidentRole
}

const { name, isMe, prevRole, newRole }: Props = $props()

const ROLES = [
  ['Scum', 'danger'],
  ['High-Scum', 'warning'],
  ['∅', 'secondary'],
  ['Vice-President', 'success'],
  ['President', 'primary'],
]

function roleName (r: PresidentRole): string {
  return ROLES[r + 2][0]
}

function roleClass (r: PresidentRole): string {
  return ROLES[r + 2][1]
}

function roleBadgeClass (r: PresidentRole, isMe?: boolean): string {
  return `badge text-bg-${isMe ? '' : 'outline-'}${roleClass(r)}`
}
</script>

<span class={roleBadgeClass(prevRole, isMe)}>
  {name}
  {#if prevRole != newRole}
    <!-- hide old rank name if it was neutral -->
    {#if prevRole}
      {roleName(prevRole)}
    {/if}

    {prevRole < newRole ? '➚' : '➘'}
  {/if}
  {#if prevRole != newRole || newRole}
    <span class={roleBadgeClass(newRole, isMe)}>{roleName(newRole)}</span>
  {/if}
</span>
