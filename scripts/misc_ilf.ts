import { $idA } from '@/util'
import { Mt19937 } from '@/util/random'

update()
window.addEventListener('hashchange', update)

function update (): void {
  $idA('copyyear').innerText = new Date().getFullYear() + ''

  let seed = location.hash.startsWith('#s=') ? parseInt(location.hash.slice(3)) : Math.floor(Date.now() / 3600000)
  if (!Number.isFinite(seed)) seed = 0

  const $pageVer = $idA<HTMLAnchorElement>('pageVer')
  $pageVer.innerText = `v${seed}`
  $pageVer.href = `#s=${seed}`

  const r = new Mt19937(seed)

  function arrayRndOne<T> (a: readonly T[]): T {
    const [i] = r.array_rand(a)
    return a[i]
  }

  function arrayRndMulti<T> (a: readonly T[], n: number): T[] {
    return r.array_rand(a, n).map((i) => a[i])
  }

  function rndClan (): string {
    const braces = [...'[[[[[[[[[(((((({{{{{'] // 45%, 30%, 25%
    const [brace] = arrayRndOne(braces)
    const braceEnd = { '[': ']', '(': ')', '{': '}' }[brace]!

    const clanLetters = [...'QWERTYUIOPASDFGHJKLZXCVBNM0123456789']
    const clanName = arrayRndMulti(clanLetters, ((r.rand(1, 100) >= 15) ? 3 : 2) + (r.rand(1, 100) >= 78 ? 1 : 0))
    // r.shuffle(clanName)
    return `${brace}${clanName.join('')}${braceEnd}`
  }

  function rndGame (): [scoreLimit: number, mode: string, map: string] {
    const modes = [
      [75, 'Team Deathmatch'],
      [250, 'Headquarters'],
      [-8, 'Search and Destroy'],
      [-1, 'Sabotage'],
      [-200, 'Domination'],
    ] as const
    const maps = [
      'Ambush',
      'Backlot',
      'Bloc',
      'Bog',
      'Countdown',
      'Crash',
      'Crossfire',
      'District',
      'Downpour',
      'Overgrown',
      'Pipeline',
      'Shipment',
      'Showdown',
      'Strike',
      'Vacant',
      'Wet Work',
      'Winter Crash',
      'Broadcast',
      'Chinatown',
      'Creek',
      'Killhouse',
    ]
    return [...arrayRndOne(modes), arrayRndOne(maps)]
  }

  function rndMatch (type: number): [matchType: number, clan: string, mode: string, map: string, big: number, small: number] {
    // type: 0 win, 1 tie, 2 loss
    const [scoreLimit, mode, map] = rndGame()
    const big = scoreLimit > 0 ? r.rand(2, scoreLimit) : r.rand(0.06 * scoreLimit, 0) - scoreLimit
    let small
    if (type & 1) small = big
    else if (big > 1) small = big - r.rand(1, big)
    else small = 0
    return [type, rndClan(), mode, map, big, small/* type ? small : big, type ? big : small */]
  }

  // in the first 19, create 3 ties, and 2 losses (14 wins)
  const m1 = []
  for (let i = 0; i < 14; i++) m1.push(rndMatch(0))
  for (let i = 0; i < 3; i++) m1.push(rndMatch(1))
  for (let i = 0; i < 2; i++) m1.push(rndMatch(2))
  r.shuffle(m1)
  // in the remaining 80, create the remaining 5 ties and 3 losses (72 wins)
  const m2 = []
  for (let i = 0; i < 72; i++) m2.push(rndMatch(0))
  for (let i = 0; i < 5; i++) m2.push(rndMatch(1))
  for (let i = 0; i < 3; i++) m2.push(rndMatch(2))
  r.shuffle(m2)

  const matches = [...m1, ...m2]
  $idA('oldMatches').replaceChildren(...matches.map(([matchType, clan, mode, map, big, small]) => {
    const bigClan = matchType < 2 ? '[ILF]' : clan
    const smallClan = matchType < 2 ? clan : '[ILF]'
    const outcome = ['Win', 'Draw', 'Loss'][matchType]

    const $e = document.createElement('h2')
    $e.className = ['win', 'tie', 'los'][matchType]
    $e.innerHTML = `${bigClan} vs ${smallClan}: ${outcome} &ndash; ${big}&mdash;${small} - ${mode} - ${map}`
    return $e
  }))

  const teamAlpha = ['Ret', 'IdrA', 'MC', 'L2P', 'QxF', 'Kassadin'].map((name) => `[ILF] ${name}`)
  r.shuffle(teamAlpha)
  teamAlpha[0] += '*'
  teamAlpha.push('More are classified&hellip;')
  $idA('teamAlpha').replaceChildren(...teamAlpha.map((name) => {
    const $li = document.createElement('li')
    const $a = document.createElement('a')
    $a.innerHTML = name
    $a.href = ''
    $li.append($a)
    return $li
  }))
}
