<script lang="ts">
import { Winner } from './game'

export let winner: Winner
export let mark: number
export let markHover = 0
export let hintClass = ''
export let hintVal = 0
export let onMove: () => void | undefined
</script>

<td
  class="p{mark} n{winner ? 0 : markHover} {hintClass}"
  class:win={winner}
  data-hintTurn={hintVal ? hintVal > 0 ? 10 - hintVal : 10 + hintVal : undefined}
  on:click={onMove}
/>

<style>
td {
  background-color: #98afc7;
  border-radius: 0.5em;
  cursor: pointer;
  height: 7rem;
  margin: 0.6em;
  position: relative;
  width: 7rem;
}

td.win {
  background-color: #696969;
}

td.win, td.n0 {
  cursor: not-allowed;
}

td:before, td:after {
  pointer-events: none;
  position: absolute;
}

td:before {
  color: #eee;
  left: 0.3em;
  top: 0; /* there is spacing from the font? */
}

td:after {
  color: white;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  text-align: center;
  line-height: 7rem;
}

td:before { font-size: 2em }
td:after { font-size: 5.6em }
td.p0:after { font-size: 4.6rem }
td.hlose,
td.htie.noW { background-color: #cd5c5c }
td.hwin,
td.htie.noL { background-color: #20b2aa }

/* current player can force a win */
/* td.hwin:after { content: "+T-" } */
td.hwin.noL:after { content: "+T" }
td.hwin.noT:after { content: "+-" }
td.hwin.noL.noT:after { content: "+" }

/* opponent can force a win */
/* td.hlose:after { content: "-T+" } */
td.hlose.noW:after { content: "-T" }
td.hlose.noT:after { content: "-+" }
td.hlose.noW.noT:after { content: "-" }

/* win by move number (hide if pending) */
td[data-hintTurn]:not(:hover):before { content: attr(data-hintTurn) }

/* no player can force a win */
td.htie.noL,
td.htie.noW { opacity: 0.5 }
td.htie.noL.noW { opacity: inherit }

td.htie.noW:after { content: "-?" }
td.htie.noL:after { content: "+?" }
td.htie.noL.noW { background-color: #ffa500 }
td.htie.noL.noW:after { content: "T" }

/* made and pending moves */
td.p1, td.p0.n1:hover { background-color: #9acd32 }
td.p2, td.p0.n2:hover { background-color: #ff7f50 }

td.p1, td.p2 { cursor: auto }

td.p0.n1:hover, td.p0.n2:hover { opacity: 0.5 }

td.p1:after, td.p0.n1:hover:after { content: "X" }
td.p2:after, td.p0.n2:hover:after { content: "O" }
</style>
