<script lang="ts">
import type { PresidentRole } from './PresidentGame.svelte'

interface Props {
  role: PresidentRole
  solid?: boolean
}

const { role, solid = false }: Props = $props()
</script>

<script lang="ts" module>
const ROLES = [
  ['Scum', 'danger'],
  ['High-Scum', 'warning'],
  ['∅', 'secondary'],
  ['Vice-President', 'success'],
  ['President', 'primary'],
]

export function roleName (r: PresidentRole): string {
  return ROLES[r + 2][0]
}

export function roleClass (r: PresidentRole): string {
  return ROLES[r + 2][1]
}

export function roleBadgeClass (r: PresidentRole, isMe?: boolean): string {
  return `badge text-bg-${isMe ? '' : 'outline-'}${roleClass(r)}`
}
</script>

<span class={roleBadgeClass(role, solid)}>{roleName(role)}</span>
