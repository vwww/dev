import * as rankedWords from './bots_random_words.json'
import { $idA, $ready } from './util'

const MAXRAND = Math.log(rankedWords.length + 1)

function getWord (): string {
  const w = Math.min(Math.exp(Math.random() * MAXRAND) | 0, rankedWords.length)
  return rankedWords[w - 1]
}

function randomSentence (maxLen: number): string {
  const result = []
  do {
    let newWord = getWord()
    if (maxLen && maxLen < newWord.length) {
      newWord = newWord.slice(0, maxLen - 1) + '&hellip;'
    }
    result.push(newWord)
    if (maxLen) {
      maxLen -= newWord.length + 1
      if (maxLen <= 1) {
        break
      }
    }
  } while (Math.random() < 0.8)
  return result.join(' ')
}

function randomTweet (remain: number = 140): string {
  const result = []
  while (remain > 1) {
    const newWords = randomSentence(remain)
    result.push(newWords)
    remain -= newWords.length + 1
  }

  return result.join('&mdash;')
}

function randomize (): void {
  const $ws = $idA('wordStream')
  let wsHTML = ''
  for (let i = 0; i < 32; ++i) {
    wsHTML += '<p>' + randomTweet() + '</p>'
  }
  $ws.innerHTML = wsHTML
}

$ready(function () {
  $idA('btnRandomize').addEventListener('click', randomize)
  randomize()
})
