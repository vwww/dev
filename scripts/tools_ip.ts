import { $idA, $ready } from './util'

const API_IP0 = 'https://d.victorz.ca/ip.json?callback=?'
const API_IP4 = 'https://d4.victorz.ca/ip.json?callback=?'
const API_IP6 = 'https://d6.victorz.ca/ip.json?callback=?'

interface IPInfo {
  ip: string
  port: number
  proxy: IPTransform[]
}

interface IPTransform {
  name: string
  rule: string
  Why: string
  old: string
  new: string
}

function process ($elemBadge: HTMLElement, $elemText: HTMLElement, url: string): void {
  $elemBadge.innerText = 'fetching'
  const startTime = Date.now()
  $.getJSON(url)
    .done((response: IPInfo) => {
      $elemBadge.className = 'badge badge-success'
      $elemBadge.innerText = `${Date.now() - startTime} ms`
      $elemText.innerText = response.ip
      if (response.proxy.length) {
        $elemText.innerText += ` [proxy count = ${response.proxy.length}]`
        $elemText.title = response.proxy.map(p => `${p.name}: ${p.old} -> ${p.new}\n${p.rule}\n${p.Why}`).join('\n\n')
      }
    })
    .fail(() => {
      $elemBadge.className = 'badge badge-danger'
      $elemBadge.innerText = 'failed'
    })
}

$ready(function () {
  process($idA('ip4'), $idA('ip4T'), API_IP4)
  process($idA('ip6'), $idA('ip6T'), API_IP6)
  process($idA('ip0'), $idA('ip0T'), API_IP0)
})
