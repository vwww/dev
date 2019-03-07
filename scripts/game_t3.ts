import { $idA, randomArrayItem } from './util'

// User Interface
const $board = $idA<HTMLTableElement>('t3table')
const $moveTable = $idA<HTMLTableElement>('t3moves')
const $msg = $idA<HTMLSpanElement>('t3status')
const $undo = $idA<HTMLButtonElement>('btnUndo')

const $btnHints = $idA<HTMLButtonElement>('btnHints')
const $btnSwap = $idA<HTMLButtonElement>('btnSwap')

let showHints = false

function uiMessage (message: string): void { $msg.innerHTML = message }

function uiReset (): void {
  uiMessage('Click to make the first move. It&rsquo;s an exciting new game.')
  uiWin(0)
  uiUndoAllow(false)
  let i = 0
  for (let r = 0; r < 3; ++r) {
    for (let c = 0; c < 3; ++c) {
      uiMoveClear(r, c, ++i) // 1 to 9
    }
  }
}

function uiMove (row: number, col: number, player: string | number, num: number): void {
  $board.rows[row].cells[col].className = 'p' + player
  $moveTable.rows[num].cells[1].innerHTML = (row * 3 + col + 1) + ''
  $moveTable.rows[num].cells[1].className = 'warning'
  if (gameIsActive()) {
    const setWin = function (i: number, canDo: number, onlyPossible: boolean, canForce: number = 0) {
      canForce = canForce > 0 ? (10 - canForce) : 0
      $moveTable.rows[num + 1].cells[i].innerHTML =
        onlyPossible ? 'Result'
          : canForce ? 'Forcable (' + (canForce === num + 1 ? 'now' : 'on #' + canForce) + ')'
            : canDo ? 'Possible'
              : 'Impossible'
      $moveTable.rows[num + 1].cells[i].className = 'table-'+ (onlyPossible || canForce ? 'info' : canDo ? 'success' : 'danger')
    }
    const entry = aiMemo[board]
    setWin(2, entry[1] & 1, entry[1] === 1, num & 1 ? -entry[0] : entry[0])
    setWin(3, entry[1] & 2, entry[1] === 2, num & 1 ? entry[0] : -entry[0])
    setWin(4, entry[1] & 4, entry[1] === 4)
  }
}

function uiMoveClear (row: number, col: number, num: number): void {
  $board.rows[row].cells[col].className = 'p0'
  $moveTable.rows[num].cells[1].innerHTML = ''
  $moveTable.rows[num].cells[1].className = ''
  if (num < 9) {
    for (let i = 2; i <= 4; ++i) {
      $moveTable.rows[num + 1].cells[i].innerHTML = ''
      $moveTable.rows[num + 1].cells[i].className = ''
    }
  }
}

function uiUpdateHints (): void {
  let i = 0
  for (let r = 0; r < 3; ++r) {
    for (let c = 0; c < 3; ++c) {
      if (!occupied(board, i)) {
        let hint = ''
        if (showHints && gameIsActive()) {
          const entry = aiMemo[board | (mark << (i << 1))]

          const noTie = !(entry[1] & 4)
          const noLose = !(entry[1] & (3 ^ mark))
          const noWin = !(entry[1] & mark)
          if (!entry[0]) {
            // no player can force a win
            // here, noTie === false
            hint = noLose
              ? noWin
                ? 'htie'
                : 'hnolose'
              : noWin
                ? 'hnowin'
                : ''
          } else if (entry[0] < 0) {
            // we can force a win
            // here, noWin === false
            hint = 'hwin' + ((noLose ? 1 : 0) | (noTie ? 2 : 0))
          } else {
            // opponent can force a win
            // here, noLose === false
            hint = 'hlose' + ((noWin ? 1 : 0) | (noTie ? 2 : 0))
          }
        }
        $board.rows[r].cells[c].className = 'p0 ' + hint
      }
      i++
    }
  }
}

function uiWin (winner: Winner): void {
  if (winner) {
    $board.className = 'w w' + winner
    uiMessage(
      winner === Winner.Tie ? 'It&rsquo;s a tie.'
        : (winner === Winner.P1 ? 'X' : 'O') + ' wins!'
    )
  } else {
    $board.className = 'n' + mark
  }

  if (showHints) uiUpdateHints()
}

function uiUndoAllow (allow: boolean) {
  $undo.disabled = !allow
}

// Bot AI
type MemoEntryWin = [number, number]
type MemoEntryRegular = [number, number, number[]]
type MemoEntry = MemoEntryRegular | MemoEntryWin

type BotAction = [number[], string]
type Bot = (board: number, used: number) => BotAction

const aiMemo: Record<number, MemoEntry> = {}

function aiBuildTables (state: number, mark: number, depth: number): MemoEntry {
  if (aiMemo[state]) return aiMemo[state]

  // Check for a win or tie
  const win = checkWin(state, depth === 9)
  if (win) {
    const value = win === 3 ? 0
      : win === mark
        ? 10 - depth
        : depth - 10
    return (aiMemo[state] = [value, 1 << (win - 1)])
  }

  let val = -2000000000
  let endFlags = 0
  let moves: number[] = []

  for (let i = 0; i < 9; ++i) {
    if (!occupied(state, i)) {
      const stateNext = state | (mark << (i << 1))
      const markNext = mark ^ 3
      const depthNext = depth + 1

      const opp = aiBuildTables(stateNext, markNext, depthNext)

      const result = -opp[0]
      endFlags |= opp[1]

      if (val === result) {
        moves.push(i)
      } else if (val < result) {
        val = result
        moves = [i]
      }
    }
  }

  return (aiMemo[state] = [val, endFlags, moves])
}

function botGenericMessage (moves: any[]): string {
  return 'The bot ' +
    (moves.length === 1
      ? 'really had no choice'
      : 'had ' + moves.length + ' choices') +
    ' for move #' + used + '.'
}

function botMoveOptimal (state: number, used: number): BotAction {
  const entry = aiMemo[state]

  const pendingWin = entry[0] && ((10 - entry[0] - (++used)) >> 1)
  const moves = entry[2]!

  return [moves,
    (pendingWin
      ? pendingWin < 2
        ? 'The bot is <strong>about to win</strong>. '
        : 'The bot <strong>will win</strong> after you survive up to ' + pendingWin + ' moves. '
      : ''
    ) + botGenericMessage(moves)
  ]
}

function botMoveNice (state: number): BotAction {
  for (let i = 0; i < 9; ++i) {
    if (!occupied(state, i)) {
      return [[i], 'Nice bot always chooses the first available slot.']
    }
  }
  throw new Error('No slots left for nice bot')
}

function botMoveRandom (state: number): BotAction {
  const moves = []

  for (let i = 0; i < 9; ++i) {
    if (!occupied(state, i)) {
      moves.push(i)
    }
  }

  return [moves, botGenericMessage(moves)]
}

const enum Player {
  None,
  P1,
  P2,
}

const enum Winner {
  None,
  P1,
  P2,
  Tie,
}

// Game state
let board: number
let mark: number
let winner: Winner
let used: number, undoLength: number
const moveStack = new Array(9)

let playerType: [number, number] = [0, 3]

function gameClear (): void {
  board = 0
  mark = 1
  winner = Winner.None

  used = 0
  undoLength = 0

  uiReset()
}

function gameMove (i: Player, human: boolean = false): void {
  if (!gameIsActive() || !gameCanMove(i)) return

  // Add move to board
  board |= mark << (i << 1)
  mark ^= 3
  moveStack[used++] = i
  winner = checkWin(board, used === 9)

  if (human) {
    undoLength++
    uiUndoAllow(true)
  }

  // Update UI
  uiMove((i / 3) | 0, i % 3, mark ^ 3, used)
  uiWin(winner)
}

function gameMoveBot (botType: Bot): void {
  if (!botType || !gameIsActive()) return

  const move = botType(board, used)
  uiMessage(move[1])
  gameMove(randomArrayItem(move[0]))
}

function moveBots (): void {
  // Move bots as needed
  let botType: number
  while (gameIsActive() && (botType = playerType[used & 1])) {
    gameMoveBot([botMoveNice, botMoveRandom, botMoveOptimal][botType - 1])
  }
}

function gameMoveHuman (i: number): void {
  uiMessage('Click to make a move.') // overwritten by bot message
  gameMove(i, true)
  moveBots()
}

function gameUndoMove (): void {
  if (!undoLength) return

  do {
    // Undo move
    const move = moveStack[--used]
    mark ^= 3
    board ^= mark << (move << 1)
    uiMoveClear((move / 3) | 0, move % 3, used + 1)
  // repeat until we have undone a human move
  } while (playerType[used & 1])

  // Remove winner
  uiWin(winner = 0)
  // Possibly disable undo button
  uiUndoAllow(--undoLength != 0)
}

function gameCanMove (i: Player): boolean { return !(board & (3 << (i << 1))) }

function gameIsActive (): boolean { return !winner }

function gameStart (): void {
  gameClear()
  moveBots()
}

// Setup scripts
document.addEventListener('DOMContentLoaded', function () {
  gameClear()
  setTimeout(function () {
    uiMessage('(Building game tables&hellip; This should take less than a second.)')
    const start = new Date()
    aiBuildTables(0, 1, 0)
    uiMessage('To build game tables, it took ' + (new Date().getTime() - start.getTime()) + ' ms.')
  }, 1)

  // Register event listeners
  let move = 0
  for (let r = 0; r < 3; ++r) {
    for (let c = 0; c < 3; ++c) {
      let i = move++
      $board.rows[r].cells[c].onclick = () => gameMoveHuman(i)
    }
  }
  $undo.onclick = function () {
    gameUndoMove()
    uiMessage('You undid your move.')
  }
  $btnHints.onclick = function () {
    showHints = !showHints
    $btnHints.className = 'w-100 btn ' + (showHints ? 'btn-success active' : 'btn-outline-secondary')
    uiUpdateHints()
  }

  const NUMPLTYPES = 4
  const setPlTypeBtn = function (i: number, j: number): void {
    for (let k = 0; k < NUMPLTYPES; ++k) {
      $idA('pl' + i + k).className = 'w-100 btn btn-outline-secondary' + (k === j ? ' active' : '')
    }
  }
  for (let i = 0; i < 2; ++i) {
    for (let j = 0; j < NUMPLTYPES; ++j) {
      $idA('pl' + i + j).onclick = (function (i, j) {
        return function () {
          setPlTypeBtn(i, j)
          playerType[i] = j
          gameStart()
        }
      })(i, j)
    }
  }
  $btnSwap.onclick = function () {
    playerType = [playerType[1], playerType[0]]
    for (let i = 0; i < 2; ++i) setPlTypeBtn(i, playerType[i])
    gameStart()
  }
})

// Utilities
function occupied (state: number, spot: number) {
  const spaceWeWant = 3 << (spot << 1)
  return state & spaceWeWant
}

// Patterns
function checkWin (state: number, full: boolean): Winner {
  if (checkPatterns(state, winPattern1)) return 1
  if (checkPatterns(state, winPattern2)) return 2
  return full ? 3 : 0
}

function checkPatterns (board: number, patterns: number[], masks: number[] = patterns): boolean {
  // assert(masks.length == patterns.length)
  for (let i = 0; i < patterns.length; ++i) {
    if ((board & masks[i]) === patterns[i]) {
      return true
    }
  }
  return false
}

// Player 1 has won
const winPattern1 = [
  // horizontal
  0b010101000000000000,
  0b000000010101000000,
  0b000000000000010101,
  // vertical
  0b010000010000010000,
  0b000100000100000100,
  0b000001000001000001,
  // diagonals
  0b010000000100000001,
  0b000001000100010000
]
// Player 2 has won
const winPattern2 = [
  // horizontal
  0b101010000000000000,
  0b000000101010000000,
  0b000000000000101010,
  // vertical
  0b100000100000100000,
  0b001000001000001000,
  0b000010000010000010,
  // diagonals
  0b100000001000000010,
  0b000010001000100000
]
