<script lang="ts">
import { deleteApp, initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue } from 'firebase/database'
import { onMount } from 'svelte'

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDzwR0qYbl6QzA4pgw-LF7M6yxG2bWC7xo',
  databaseURL: 'https://victor-poke.firebaseio.com'
}

let bingTomorrowData: any[] = $state([])

onMount(() => {
  const firebaseApp = initializeApp(FIREBASE_CONFIG)

  const db = getDatabase(firebaseApp)
  const r = ref(db, 'bingtomorrow')
  onValue(r, function (snapshot): void {
    const data = (snapshot && snapshot.val()) || {}
    const dataKeys = Object.keys(data).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    bingTomorrowData = dataKeys.map((id) => ({ ...data[id], id }))
  })

  return () => {
    bingTomorrowData = []
    deleteApp(firebaseApp)
  }
})

function idToFormattedDate (id: string): string {
  const year = id.slice(0, -4)
  const month = id.slice(-4, -2)
  const day = id.slice(-2)
  return new Date(+year, +month - 1, +day).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

{#each bingTomorrowData as entry}
  <div class="card mb-3">
    <div class="card-body">
      <h5 class="card-title">{entry.title}</h5>
      <p class="card-text"><a href={entry.copyrightlink}>{entry.copyright}</a></p>
      <p class="card-text"><small class="text-muted">{idToFormattedDate(entry.id)}</small></p>
    </div>
    <a href="https://bing.com{entry.url}">
      <img src="https://bing.com{entry.urlbase}_640x360.jpg" class="card-img-bottom" alt={entry.title}>
    </a>
  </div>
{/each}
