<script lang="ts">
import TweetList from '../random/TweetList.svelte'

import { Grammar, TokenStream } from './grammar'

interface ExampleFile {
  name: string
  download_url: string
}

let loadError: unknown = $state()
let exampleFiles: ExampleFile[] | undefined = $state()
let exampleFile: ExampleFile | undefined = $state()
const fileCache: Record<ExampleFile['name'], string> = {}

const EXAMPLES_URL = 'https://api.github.com/repos/theonlypwner/tokenstream/contents/examples'
const EXAMPLE_PREFERRED = 'manythings_rs.txt'

let grammarText = $state('')

let grammar: Grammar | undefined = $state()
let grammarSourceText = $state('')
let grammarTime = $state('')
let grammarError: unknown = $state()

let grammarRule = $state('')

const TWEET_LEN = 280

type Tweet = [short: string, long?: string]

let tweetError: unknown = $state()
let tweetsGrammarTime = $state('')
let tweetsRule = $state('')
let tweets: Tweet[] = $state([])

function generateTweet (maxLen = TWEET_LEN): Tweet {
  if (!grammar) {
    return ['ERROR']
  }

  const result = []
  let remain = maxLen
  while (remain > 1) {
    const newSentence = new TokenStream(grammar, grammarRule).produce()
    result.push(newSentence)
    remain -= newSentence.length + 1
  }

  const tweet = result.join(' ')
  if (tweet.length > maxLen) {
    const tweetShort = tweet.slice(0, maxLen - 1) + '\u2026' // '&hellip;'
    return [tweetShort, tweet]
  }
  return [tweet]
}

function generate (): void {
  const NUM_TWEETS = 16
  try {
    tweets = Array.from({ length: NUM_TWEETS }, generateTweet)
    tweetsGrammarTime = grammarTime
    tweetsRule = grammarRule
    tweetError = undefined
  } catch (e) {
    console.error(tweetError = e)
  }
}

async function downloadFile (url: string) {
  const resp = await fetch(url)
  return resp.text()
}

function parseGrammar () {
  try {
    grammar = Grammar.fromStr(grammarSourceText = grammarText)
    grammarRule = grammar.productionOrder.at(-1)!
    grammarTime = new Date().toISOString()
    grammarError = undefined
  } catch (e) {
    console.error(grammarError = e)
  }
}

async function loadFile () {
  const { download_url } = exampleFile!
  grammarText = fileCache[download_url] ??= await downloadFile(download_url)
  parseGrammar()
}

async function init () {
  try {
    const resp = await fetch(EXAMPLES_URL)
    exampleFile = (exampleFiles = await resp.json())[0]

    for (const file of exampleFiles!) {
      if (file.name === EXAMPLE_PREFERRED) {
        exampleFile = file
        await loadFile()
        generate()
        break
      }
    }
  } catch (e) {
    console.error(loadError = e)
  }
}

void init()
</script>

{#if exampleFiles}
  <div class="input-group my-3">
    <span class="input-group-text">Example</span>
    <select class="form-select {exampleFile && grammarText === fileCache[exampleFile.download_url] ? `is-${grammarText ? '' : 'in'}valid` : ''}" bind:value={exampleFile}>
      {#each exampleFiles as e}
        <option value={e}>{e.name}</option>
      {/each}
    </select>
    <button class="btn btn-outline-secondary" type="button" onclick={loadFile}>Load</button>
    <button class="btn btn-outline-primary" type="button" onclick={parseGrammar}>Parse</button>
  </div>
{:else if loadError}
  <div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Loading Error</h4>
    <pre>{(loadError as Error).stack ?? loadError}</pre>
  </div>
{:else}
  <div class="alert alert-warning" role="alert">
    This page is loading the presets&hellip;
  </div>
{/if}

<textarea class="form-control mb-3 {grammarSourceText === grammarText ? `is-${grammarError ? 'in' : ''}valid` : ''}" bind:value={grammarText} placeholder="rule = &quot;terminal&quot;"></textarea>

{#if grammarError}
  <div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Parse Error</h4>
    <pre>{(grammarError as Error).stack ?? grammarError}</pre>
  </div>
{:else if grammar}
  <p>Grammar parsed at {grammarTime}</p>
  <div class="input-group my-3">
    <span class="input-group-text">Rule</span>
    <select class="form-select" class:is-valid={tweetsGrammarTime === grammarTime && grammarRule === tweetsRule} bind:value={grammarRule}>
      {#each grammar?.productionOrder as e}
        <option>{e}</option>
      {/each}
    </select>
    <button class="btn btn-outline-primary" type="button" onclick={generate}>Generate</button>
  </div>
{/if}

{#if tweetError}
  <div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Generation Error</h4>
    <pre>{(tweetError as Error).stack ?? tweetError}</pre>
  </div>
{/if}

<TweetList {tweets} />
