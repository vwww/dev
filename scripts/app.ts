import AppBotsGooguns from './bots/googuns/AppBotsGooguns.svelte'
import AppBotsRandom from './bots/random/AppBotsRandom.svelte'
import AppGameActionless from './game/actionless/AppGameActionless.svelte'
import AppGameRPSRules from './game/rps/AppGameRPSRules.svelte'
import AppMiscContest from './misc/contest/AppMiscContest.svelte'
import AppMiscGGroups from './misc/ggroups/AppMiscGGroups.svelte'
import AppToolsBase from './tools/base/AppToolsBase.svelte'
import AppToolsGCD from './tools/gcd/AppToolsGCD.svelte'

declare global {
  interface Window {
    appRoute: string
    app: any
  }
}

// map of all app routes
let routes: Record<string, any> = {
  bots_googuns: AppBotsGooguns,
  bots_random: AppBotsRandom,
  game_actionless: AppGameActionless,
  game_rps_rules: AppGameRPSRules,
  misc_contest: AppMiscContest,
  misc_ggroups: AppMiscGGroups,
  tools_base: AppToolsBase,
  tools_gcd: AppToolsGCD,
}

// load app
if (window.appRoute in routes) {
  const app = new routes[window.appRoute]({ target: document.querySelector('#app') })
  window.app = app // potentially useful for debugging
}

// remove "failed to load" message
document.getElementById('appLoading')!.remove()
