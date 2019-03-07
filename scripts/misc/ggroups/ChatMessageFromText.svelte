<script>
import ChatMessage from './ChatMessage'

export let allowSecretSystemMessages
export let rawText

let msgClassNum = 0
let sender = ''
let text = ''

$: {
  if (rawText[0] === '#') {
    msgClassNum = 1 // '^m7^Cz'
    if (rawText[1] === 'T') text = rawText.slice(3)
    else if (rawText[1] === 'j') text = 'USER ' + rawText.slice(2) + ' JOINED'
    else if (rawText[1] === 'b') text = 'USER ' + rawText.slice(2) + ' BANNED'
    else if (rawText[1] === 'l') text = 'USER ' + rawText.slice(2) + ' LEFT'
    else if (rawText[1] === 'k') text = 'USER ' + rawText.slice(2) + ' KICKED'
    else text = ''
  } else if (rawText[0] === '!') {
    if (!allowSecretSystemMessages) {
      text = ''
    } else {
      msgClassNum = 2 // '^Fr^M1^Cr'
      text = rawText.slice(1).toUpperCase()
    }
  } else {
    let num = rawText.indexOf(':')
    if (num <= 0) num = 0

    sender = rawText.slice(0, num)
    text = rawText.slice(num + 1)
  }
}

</script>

{#if text}
  <ChatMessage {sender} {text} {msgClassNum} />
{/if}
