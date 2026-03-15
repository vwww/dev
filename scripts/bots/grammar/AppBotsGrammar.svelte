<script lang="ts">
import { englishJoin, firstCap, randomArrayItem } from '@/util'

import TweetList, { TWEET_LEN, type Tweet } from '../TweetList.svelte'

const RULES: [string | string[], string | ((s: string) => string)][] = [
  ['[a lot] of', '‘allot’ is a verb; ‘a lot’ is a noun or adverb'],
  ['[its] own', `‘it's’ means ‘it is’ or ‘it has’, but ‘its’ is possessive`],
  [
    [
      '[there] be',
      '[there] is',
      '[there] are',
      "[there] isn't",
      "[there] aren't",
      '[there] should',
      '[there] would',
      '[there] could',
    ],
    '‘their’ is possessive; ‘there’ is a pronoun or an adverb'
  ],
  [['I am [here]', 'are [here]', 'be [here]'], 'I am ‘here’ to ‘hear’'],
  ["[who's] been", "‘whose’ is possessive; ‘who's’ means ‘who has’"],
  ['I am [bored] with', '‘board’ is a noun; ‘bored’ is a verb'],
  [['[you] are', "[you] aren't"], '‘your’ is a possessive determiner; ‘you’ is a pronoun'],
  [["[isn't] supposed to", "[I'm not] supposed to"], '‘supposed’ is a participle, not a bare infinitive'],
  [
    [
      '[Whoever] is',
      '[Whoever] are',
      '[Whoever] was',
      'those [who] are',
      'person [who] is',
      'person [who] are',
      'persons [who] are',
      'persons [who] is',
      'people [who] are',
      'people [who] is',
      'people [who] were',
      'people [who] was',
    ],
    (s) => {
      const words = s.split(' ')
      const withFix = words.at(-2)!.slice(1, -1)
      return `unlike ‘${withFix.replace('o', 'om')}’, ‘${withFix}’ is the subject of ‘${words.at(-1)}’`
    }
  ],
]

// Prefix

const MSG_PREFIXES: [clause: string, that?: boolean][] = [
  // confident
  ['it is the case that'],
  ['it is true that'],
  ['in this case,'],
  ['I am confident', true],
  ['I am sure', true],
  ['I say', true],
  ['I claim', true],
  ['I aver that'],
  ['I assert that'],
  ['I contend that'],
  ['I declare that'],
  ['I insist that'],
  ['I note that'],
  ['I state that'],
  ['I comment that'],
  ['I argue that'],
  ['I opine that'],
  ['I maintain that'],
  ['I noticed', true],
  ['I discovered', true],
  ['I see', true],
  // I found that, I notice (that)
  // weaker
  ['it seems', true],
  ['to me, it seems', true],
  ['it seems to me', true],
  ['it appears', true],
  ['to me, it appears', true],
  ['it appears to me', true],
  ['it seems like'],
  ['it looks like'],
  ['it seems to be the case that'],
  ['it appears to be the case that'],
  ['it seems to be true that'],
  ['it appears to be true that'],
  ['it is likely that'],
  ['it is probable that'],
  // weak
  ['I think', true],
  ['I believe', true],
  ['I reckon', true],
  ['I suppose', true],
  ['I suspect', true],
  ['I feel', true],
  ['I am of the opinion that'],
  ['it is in my opinion that'],
  ['it is my opinion that'],
  // sort of uncertain
  ['I guess', true],
]

// Random verbs

function randInfinitive (): [modal: string, verb: string] {
  const modal = randomArrayItem(['should', 'ought to', 'could', 'can', 'meant to', 'intended to'])
  // without 'to'
  return [modal, randInfinitiveVerb()]
}
function randInfinitiveVerb (): string {
  // without 'to'
  return randomArrayItem(['use', 'say', 'tweet', 'post', 'type', 'write'])
}

function randPastPerfect (): [modal: string, verb: string] {
  const modal = randomArrayItem(['should have', 'ought to have', 'could have'])
  return [modal, randPastVerb()]
}
function randPastVerb (): string {
  // (simple [past) perfect]
  return randomArrayItem(['used', 'said', 'tweeted', 'posted', 'typed'])
}

// Random nouns

function randTweetNoun (includeArticle: boolean): string {
  if (includeArticle) {
    return randomArrayItem(['a tweet', 'a post', 'a status', 'a message',
      'a status update', 'an update'])
  }
  return randomArrayItem(['tweet', 'post', 'status', 'message',
    'status update', 'update'])
}

function randMistakeNoun (): string {
  return randomArrayItem(['an error', 'a mistake', 'a solecism', 'a typo'])
}

const MSG_LOADERS: ((secondPerson: boolean, clause: string) => [prefix: string, suffix: string])[] = [
  (secondPerson, c) => cleft(yourPrepend(secondPerson, c), randPastPerfect().join(' ')),
  (secondPerson, c) => {
    const [m, v] = randPastPerfect()
    return cleft(yourPrepend(secondPerson, c), m+' '+v)
  },
  (secondPerson, c) => {
    const [m, v] = randInfinitive()
    return cleft(yourPrepend(secondPerson, c), m+' '+v)
  },
  (secondPerson, c) => {
    const a = randomArrayItem(['could', 'might', 'would'])
    const b = randomArrayItem(['have been', 'be'])
    return [
      clauseAppend(
        yourPrepend(secondPerson, c),
        `it ${a} ${b} better if `),
      'had ' + randPastVerb()
    ]
  },
  (secondPerson, c) => {
    c = yourPrepend(secondPerson, c)
    let s = ''
    if (Math.random() < .50) {
      c = clauseAppend(c, 'it is possible for ')
      s = 'to ' + randInfinitiveVerb()
    } else {
      c = clauseAppend(c, 'it was possible for ')
      s = 'to have ' + randPastVerb()
    }
    return [c, s]
  },
  (secondPerson, c) => {
    let suffix: string
    // infinitive rather than perfect (50%)
    const [m, v] = Math.random() < .50 ? randInfinitive() : randPastPerfect()
    const n = randMistakeNoun()
    if (Math.random() < .50) { // perfect (have) instead of simple past (50%)
      const h = secondPerson ? 'have' : 'has'
      const a = randomArrayItem(['written', 'made', 'created', 'tweeted', 'posted', 'typed'])
      suffix = `${h} ${a} ${n} and ${m} ${v}`
    } else {
      const a = randomArrayItem(['wrote', 'made', 'created', 'tweeted', 'posted', 'typed'])
      suffix = `${a} ${n} and ${m} ${v}`
    }
    return cleft(c, suffix)
  },
  (secondPerson, c) => {
    let suffix: string
    // infinitive rather than perfect (50%)
    const [m, v] = Math.random() < .50 ? randInfinitive() : randPastPerfect()
    const n = randTweetNoun(true)
    if (Math.random() < .50) { // perfect (have) instead of simple past (50%)
      const h = secondPerson ? 'have' : 'has'
      const a = randomArrayItem(['miswritten', 'botched', 'blundered', 'messed up', 'malformed', 'screwed up', 'mistyped'])
      suffix = `${h} ${a} ${n} and ${m} ${v}`
    } else {
      const a = randomArrayItem(['miswrote', 'botched', 'blundered', 'messed up', 'malformed', 'screwed up', 'mistyped'])
      suffix = `${a} ${n} and ${m} ${v}`
    }
    return cleft(c, suffix)
  },
  () => {
    const prefix = ['I',
      randomArrayItem(['consider', 'deem', 'declare']),
      randomArrayItem(['the', 'this']),
      randTweetNoun(false),
      randomArrayItem(['of', 'by']),
      '',
    ].join(' ')
    const suffix = randomArrayItem(['invalid', 'incorrect', 'wrong', 'erroneous', 'unacceptable', 'unsuitable']) +
      '; it should ' + randomArrayItem(['be', 'say', 'read'])
    return [prefix, suffix]
  },
  () => {
    const prefix = `I ${randomArrayItem(['suggest', 'recommend'])} that `
    const suffix = randInfinitiveVerb()
    return [prefix, suffix]
  },
]

function clauseAppend (c: string, repl: string): string {
  if (Math.random() < .50) {
    // 50% chance to append to the first clause
    c += repl
  } else {
    c = repl
  }
  return c
}

function yourPrepend (ok: boolean, c: string): string {
  if (ok && Math.random() < .30) {
    return `in ${randomArrayItem(['your', 'this'])} ${randTweetNoun(false)}, `
  }
  return c
}

function cleft (prefix: string, suffix: string): [string, string] {
  if (Math.random() < .10) { // Cleft sentence (10%)
    prefix += 'it is '
    suffix = randomArrayItem(['who ', 'that ']) + suffix
  }
  return [prefix, suffix]
}

function makeTweet (): Tweet {
  const abstractRules = []

  while (!abstractRules.length || Math.random() < 0.1) {
    abstractRules.push(randomArrayItem(RULES))
  }

  const rules = abstractRules.map(([correctionOrMultiple, rule]) => {
    const c = typeof correctionOrMultiple === 'string' ? correctionOrMultiple : randomArrayItem(correctionOrMultiple)
    return [c, typeof rule === 'string' ? rule : rule(c)]
  })
  const corrections = rules.map(([correction]) => `“${correction}”`)

  // Build the sentence!
  let user = '@user'
  let clause = ''
  if (Math.random() < .75) { // Add prefix (75%)
    const [clauseNoSpace, that] = randomArrayItem(MSG_PREFIXES)
    clause = clauseNoSpace + (that && Math.random() < .5 ? ' that ' : ' ') // use "that" (50%)
  }
  const secondPerson = !clause || Math.random() < .65
  if (secondPerson) { // 2nd person instead of 3rd (65%)
    user = `you, ${user},`
  }

  const [prefix, suffix] = randomArrayItem(MSG_LOADERS)(secondPerson, clause)

  // Build the entire sentence
  let result = prefix +
    user + ' ' +
    suffix + ' ' +
    englishJoin('and', corrections) + ' instead.'

  // Explain why, if we have space
  let remain = TWEET_LEN - result.length
  // at least 3 characters have to be added per item
  for (let i = 0; remain >= 3 && i < rules.length; i++) {
    const why = firstCap(rules[i][1])
    const nextLen = 2 + why.length
    if (remain >= nextLen) {
      result += ' ' + why + '.'
      remain -= nextLen
    }
  }

  return [firstCap(result), new Date()]
}

let tweets: Tweet[] = $state([])

function generate (): void {
  const NUM_TWEETS = 16
  tweets = Array.from({ length: NUM_TWEETS }, makeTweet).reverse()
}

generate()
</script>

<button class="btn btn-primary d-block w-100 mb-3" onclick={generate}>Generate</button>

<TweetList {tweets} alwaysShowFull />
