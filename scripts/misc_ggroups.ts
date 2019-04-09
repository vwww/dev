import { textAsset } from './misc/ggroups_text'
import { $idA, $ready, shuffle } from './util'

let forumStrings: string[][]
let forumStringsOrig: string[][]
let allowSecretSystemMessages: boolean = true

forumStringsOrig = textAsset
  .split(/[\r\n]+-+[\r\n]+/)
  .map(function (currentValue) {
    return currentValue.split(/[\r\n]+/).map(function (currentValue) {
      // (USED) O thisConsoleCallback && thisConsoleCallback()
      // C color = GetNextChar()
      // I ignoreDefaultPunctuationWaits ^= true
      // w waitMulti = GetNextChar() * 1
      // (USED) W waitMulti = GetNextChar() * 10
      // (USED) M waitMultiPersistent = GetNextChar() * 1
      // H waitMultiPersistent = 0.0001
      // Z waitMultiPersistent = 1.25
      // D baseSpeed++
      // > writingSpeed++
      // < writingSpeed--, writingSpeed < 1 && writingSpeed = 1
      // E waitsForEnter = true
      // m waitMultiPersistent = (float)(1 / int.Parse(GetNextChar().ToString()) * 1)
      // F parent && (parent is SHGUIguruchatwindow) && (parent as SHGUIguruchatwindow).SetFrameColor(GetNextChar())
      return currentValue.replace(/\^(O|[MW].)/g, '')
    })
  })

function regenerate (): void {
  function msgHTML (sender: string, text: string, msgClassNum: number): string {
    let msgClass = 'primary text-white'
    let floatSide = ''

    if (msgClassNum === 1) msgClass = 'light'
    else if (msgClassNum === 2) msgClass = 'danger text-white'
    else floatSide = 'float-right'

    return '<div class="clearfix"><div class="card my-1 clearfix ' + floatSide + '">' +
      (sender
        ? '<div class="card-header bg-' + msgClass + '">' + sender + '</div>' + '<div class="card-body">' + text + '</div>'
        : '<div class="card-header bg-' + msgClass + '">' + text + '</div>'
      ) +
      '</div></div>'
  }
  let html = allowSecretSystemMessages
    ? msgHTML('', 'LISTENING TO #HACKING. PRIVILEGED ACCESS.', 2)
    : msgHTML('', 'LISTENING TO #HACKING.', 1)
  // allowSecretSystemMessages ? "^Fr^Cr^m7^OLISTENING TO #HACKING. PRIVILEGED ACCESS." : "^m7^Cz^OLISTENING TO #HACKING."
  for (let i = 0; i < forumStrings.length; ++i) {
    const conversation = forumStrings[i]

    html += '<hr>'
    for (let j = 0; j < conversation.length; ++j) {
      let text = conversation[j]
      let msgClass = 0
      let sender = ''

      if (text[0] === '#') {
        msgClass = 1 // '^m7^Cz'
        if (text[1] === 'T') text = text.slice(3)
        else if (text[1] === 'j') text = 'USER ' + text.slice(2) + ' JOINED'
        else if (text[1] === 'b') text = 'USER ' + text.slice(2) + ' BANNED'
        else if (text[1] === 'l') text = 'USER ' + text.slice(2) + ' LEFT'
        else if (text[1] === 'k') text = 'USER ' + text.slice(2) + ' KICKED'
        else continue
      } else if (text[0] === '!') {
        if (!allowSecretSystemMessages) continue
        msgClass = 2 // '^Fr^M1^Cr'
        text = text.slice(1).toUpperCase()
      } else {
        let num = text.indexOf(':')
        if (num <= 0) num = 0

        sender = text.slice(0, num)
        text = text.slice(num + 1)
      }

      html += msgHTML(sender, text, msgClass)
    }
  }
  html += '<hr>' + msgHTML('', 'LEAVING #HACKING', 1) + '<hr>' // "^m7^CzLEAVING #HACKING"
  $idA('ggroups-main').innerHTML = html
}

function togglePriv (): void {
  allowSecretSystemMessages = !allowSecretSystemMessages
  $idA('btn-priv').className = allowSecretSystemMessages ? 'btn btn-success active' : 'btn btn-warning'
  regenerate()
}

function randomize (on?: boolean): void {
  if (on) {
    forumStrings = forumStringsOrig.map(function (v) { return v.slice(0) })
    shuffle(forumStrings)
  } else {
    forumStrings = forumStringsOrig
  }
  regenerate()
}

$ready(function () {
  $idA('btn-priv').addEventListener('click', togglePriv)
  $idA('btn-order').addEventListener('click', () => randomize())
  $idA('btn-randomize').addEventListener('click', () => randomize(true))
  randomize(true)
})
