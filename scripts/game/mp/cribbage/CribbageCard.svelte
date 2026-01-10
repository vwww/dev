<script lang="ts">
interface Props {
  card: number
  outline?: boolean
  colorScheme: number
}

const { card, outline = true, colorScheme }: Props = $props()

const rank = $derived(card >> 2)
const suit = $derived(card & 3)
</script>

<script module>
export const colorNames = ['No', 'Two', 'Poker', 'Bridge']

export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const suits = ['♣', '♦', '♥', '♠']
export const suitColor = [
  ['secondary', 'secondary', 'secondary', 'secondary'],
  ['secondary', 'danger', 'danger', 'secondary'],
  ['success', 'primary', 'danger', 'secondary'],
  ['success', 'warning', 'danger', 'secondary'],
]

export const rankNames = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King']
export const suitNames = ['Club', 'Diamond', 'Heart', 'Spade']
</script>

<span class="badge text-bg-{outline ? 'outline-' : ''}{suitColor[colorScheme][suit]}" title="{rankNames[rank]} of {suitNames[suit]}s">{ranks[rank]}{suits[suit]}</span>
