<script lang="ts">
import { onMount } from 'svelte'

import TweetList, { TWEET_LEN, type Tweet } from '../TweetList.svelte'

const ML_LEN = TWEET_LEN - 75

type WeightedEdges = Record<string, number>

let chains: Record<string, [edges: WeightedEdges, totalWeight: number]> = $state({})
let S = $state(0)
let T = $state(0)
let Sfiltered = $state(0)
let Tfiltered = $state(0)
let loadError: unknown = $state()
let tweets: Tweet[] = $state([])

function weightedChoice ([choices, totalWeight]: [WeightedEdges, number], [disallow, disallowWeight]: [Set<string>, number]): string | undefined {
  let r = totalWeight - disallowWeight
  if (!r) {
    return
  }
  r = Math.floor(Math.random() * r)
  for (const [c, w] of Object.entries(choices)) {
    if (disallow.has(c)) {
      continue
    }
    if (r <= w) {
      return c
    }
    r -= w
  }
  return
}

function mostLikely ([choices]: [WeightedEdges, number], [disallow]: [Set<string>, number]): string | undefined {
  let result = undefined
  let resultw = 0
  for (const [c, w] of Object.entries(choices)) {
    if (!disallow.has(c) && (resultw < w || (resultw === w && result! > c))) {
      result = c
      resultw = w
    }
  }
  return result
}

function walk(
  nextCallback: (
    next: [choices: WeightedEdges, weight: number],
    d: [disallow: Set<string>, disallowWeight: number]
  ) => string | undefined,
  limit: number
): string {
  const prev = ['', '']
  const result: string[] = []
  const disallow = new Map<string, [Set<string>, number]>()

  for (let i = 0; i < 400; i++) {
    const key = prev.join(' ')
    const next = chains[key]
    if (!next) {
      break
    }

    let d = disallow.get(key)
    if (!d) {
      disallow.set(key, d = [new Set(), 0])
    }

    const token = nextCallback(next, d)
    if (!token) {
      break
    }
    d[0].add(token)
    d[1] += next[0][token]

    prev[0] = prev[1]
    prev[1] = token

    result.push(token)

    if ((limit -= token.length + 1) <= 0) {
      break
    }
  }

  return result.join(' ')
}

function makeTweet (): Tweet {
  const ret = [`[${S.toString(36)}/${T.toString(36)}] `]
  let retLen = ret[0].length

  let t = walk(mostLikely, ML_LEN)
  for (;;) {
    ret.push(t)
    retLen += t.length + 1

    if (retLen >= TWEET_LEN) {
      break
    }

    t = walk(weightedChoice, TWEET_LEN - retLen)
    if (!t) {
      break
    }

    ret.push('\u2014') // &mdash;
  }

  return [ret.join(''), new Date()]
}

function generate (): void {
  const NUM_TWEETS = 16
  tweets = Array.from({ length: NUM_TWEETS }, makeTweet).reverse()
}

onMount(async () => {
  try {
    const res = await fetch('recentideas.json')
    const rawChains: Record<string, Record<string, number>> = await res.json()

    let s = 0
    let t = 0
    for (const [state, originalTransitions] of Object.entries(rawChains)) {
      const transitions: Record<string, number> = {}
      let totalWeight = 0

      for (const [nextState, weight] of Object.entries(originalTransitions)) {
        if (weight > 1) {
          transitions[nextState] = weight

          t++
          totalWeight += weight
        }
        T++
      }

      if (totalWeight) {
        chains[state] = [transitions, totalWeight]
        s++
      }
      S++
    }
    Sfiltered = s
    Tfiltered = t

    generate()
  } catch (e) {
    console.error(loadError = e)
  }
})
</script>

{#if S}
  <p>{Sfiltered}/{Tfiltered} [{Sfiltered.toString(36)}/{Tfiltered.toString(36)}] states/transitions are filtered from the original {S}/{T} [{S.toString(36)}/{T.toString(36)}].</p>

  <button class="btn btn-primary d-block w-100 mb-3" onclick={generate}>Generate</button>
{:else if loadError}
  <div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Error</h4>
    <pre>{(loadError as Error).stack ?? loadError}</pre>
  </div>
{:else}
  <div class="alert alert-warning" role="alert">
    This page is loading the Markov chain&hellip;
  </div>
{/if}

<TweetList {tweets} />
