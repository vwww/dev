<script lang="ts">
import { Winner } from './game'

interface Props {
  winner: Winner
  mark: number
  markHover?: number
  hintClass?: string
  hintVal?: number
  onMove?: () => void
}

let {
  winner,
  mark,
  markHover = 0,
  hintClass = '',
  hintVal = 0,
  onMove,
}: Props = $props()
</script>

<td
  class="p{mark} n{winner ? 0 : markHover} {hintClass}"
  class:win={winner}
  data-hintTurn={hintVal ? hintVal > 0 ? 10 - hintVal : 10 + hintVal : undefined}
  onclick={onMove}
></td>

<style>
td {
  background-color: #98afc7;
  border-radius: 0.5em;
  cursor: not-allowed;
  height: 7rem;
  margin: 0.6em;
  position: relative;
  width: 7rem;

  &.win {
    background-color: #696969;
  }

  &:before, &:after {
    position: absolute;
  }

  &:before {
    color: #eee;
    left: 0.3em;
    top: 0; /* there is spacing from the font? */
  }

  &:after {
    color: white;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
    text-align: center;
    line-height: 7rem;
  }

  &:before { font-size: 2em }
  &:after { font-size: 5.6em }
  &.p0:after { font-size: 4.6rem }
  &.hlose,
  &.htie.noW { background-color: #cd5c5c }
  &.hwin,
  &.htie.noL { background-color: #20b2aa }

  /* current player can force a win */
  &.hwin {
    &.noL:after { content: "+T" }
    &.noT:after { content: "+-" }
    &.noL.noT:after { content: "+" }
  }

  /* opponent can force a win */
  &.hlose {
    &.noW:after { content: "-T" }
    &.noT:after { content: "-+" }
    &.noW.noT:after { content: "-" }
  }

  /* win by move number (hide if pending) */
  &[data-hintTurn]:not(:hover):before { content: attr(data-hintTurn) }

  /* no player can force a win */
  &.htie {
    &.noL,
    &.noW { opacity: 0.5 }
    &.noL.noW { opacity: inherit }

    &.noW:after { content: "T-" }
    &.noL:after { content: "T+" }
    &.noL.noW { background-color: #ffa500 }
    &.noL.noW:after { content: "T" }
  }

  /* made and pending moves */
  &.p1, &.p0.n1:hover {
    background-color: #9acd32;
    &:after { content: "X" }
  }
  &.p2, &.p0.n2:hover {
    background-color: #ff7f50;
    &:after { content: "O" }
  }

  &.p0.n1, &.p0.n2 {
    cursor: pointer;
    &:hover { opacity: 0.5 }
  }
}
</style>
