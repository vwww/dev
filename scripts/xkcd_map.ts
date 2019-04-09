import { $idA } from './util'

// from other repo
declare const available: Record<string, string[]>

/*
import * as L from 'leaflet'
type LPoint = L.Point
/*/
// declare const L: typeof import('leaflet')
declare const L: any
type LPoint = { x: number, y: number, z: number }
// */

// Map
const START_POS = new L.LatLng(1.1, 0.2)
const MAX_ZOOM = 10 // also the maximum
const map = L.map('map', {
  center: START_POS,
  zoom: MAX_ZOOM,
  crs: L.Util.extend({}, L.CRS.EPSG3857, { infinite: true }),
  fullscreenControl: true
})

// Attribution
map.attributionControl.setPrefix('') // move prefix to last attribution
map.attributionControl.addAttribution('<span id="attribution"><a href="//victorz.ca">Victor</a>&rsquo;s zoomable visualization of <a href="https://xkcd.com/1110/" rel="external nofollow">xkcd: Click and Drag</a></span> (<a href="https://creativecommons.org/licenses/by-nc/2.5/">CC-BY-NC 2.5</a>)')
map.attributionControl.addAttribution('inspired by <a href="https://xkcd-map.rent-a-geek.de">dividuum</a>\'s map')
map.attributionControl.addAttribution('images served by <a href="https://github.com">GitHub</a> (with <a href="https://www.fastly.com">Fastly</a>)')
map.attributionControl.addAttribution('<script id="_wau_target"></script>')
map.attributionControl.addAttribution('powered by <a href="https://leafletjs.com">Leaflet</a>')

// Online
declare global {
  interface Window {
    _wau?: [string, string, string][]
  }
}
window._wau = window._wau || [['small', 'xvictorx', '_target']]
;(function () {
  const s = document.createElement('script')
  s.async = true
  s.src = '//widgets.amung.us/small.js'
  document.getElementsByTagName('head')[0].appendChild(s)
})()

// Hide .autoclose on drag
map.on('dragstart',
  function dragstartHook () {
    const target = $idA('autoclose')
    if (target.parentNode) target.parentNode.removeChild(target)
    map.off('dragstart', dragstartHook)
  }
)

// Hide #intro on move
map.on('movestart',
  function movestartHook () {
    $idA('intro').style.display = 'none'
    map.off('movestart', movestartHook)
  }
)

// Tiles
const STILE_URL = 'https://vwww.github.io/xkcd-map/'
const LAYER_URL = 'https://vwww.github.io/xkcd-map/converted/{z}-{x}-{y}.png'

function hasTile (zoom: string | number, x: number, y: number) {
  return zoom in available && available[zoom].indexOf(x + '-' + y) !== -1
}

const tileLayer = L.tileLayer(LAYER_URL, {
  maxZoom: MAX_ZOOM,
  subdomains: '1234567890'
})
const tileLayer2 = L.tileLayer(LAYER_URL, {
  minZoom: 2,
  maxZoom: 4,
  subdomains: '1234567890'
})

tileLayer.getTileUrl = tileLayer2.getTileUrl = function (tilePoint: LPoint, zoom: number) {
  zoom = zoom || this._getZoomForUrl()
  if (hasTile(zoom, tilePoint.x, tilePoint.y)) {
    return L.Util.template(this._url, L.Util.extend({
      s: this._getSubdomain(tilePoint),
      z: zoom,
      x: tilePoint.x,
      y: tilePoint.y
    }, this.options))
  }

  let blockName = 'ground'
  if (zoom) {
    if (tilePoint.y < (1 << (zoom - 1))) blockName = 'sky'
  } else {
    if (!tilePoint.y) blockName = 'split'
    if (tilePoint.y < 0) blockName = 'sky'
  }
  return STILE_URL + blockName + '.png'
}
tileLayer.addTo(map)

const CanvasLayer = L.GridLayer.extend({
  createTile: function (coords: LPoint) {
    const tile = document.createElement('canvas')

    const tileSize = this.getTileSize()
    tile.setAttribute('width', tileSize.x)
    tile.setAttribute('height', tileSize.y)

    const ctx = tile.getContext('2d')
    if (!ctx) return

    this.drawTile(tile, coords, coords.z)

    return tile
  }
})

// Tile Highlighting layers
function originalName (tx: number, ty: number, x: number, y: number, zoom: number) {
  const ZOOM_EQUAL = 7
  const eqX = (tx << (MAX_ZOOM - zoom)) + x
  const eqY = (ty << (MAX_ZOOM - zoom)) + y

  let newx: string | number = eqX + 1 - (1 << (MAX_ZOOM - 4))
  if (newx <= -33 || newx > 48) return false // 81 frames wide (33 West - 48 East)
  let newy: string | number = eqY + 1 - (1 << (MAX_ZOOM - 4))
  if (newy <= -19 || newy > 13) return false // 32 frames tall (13 North - 19 South)

  const valid = hasTile(ZOOM_EQUAL, eqX, eqY)

  if (newx >= 0) newx = newx + 'e'
  else newx = (1 - newx) + 'w'

  if (newy >= 0) newy = newy + 's'
  else newy = (1 - newy) + 'n'

  const png = newy + newx + '.png' // + ' (' + tx + ', ' + ty + ' / ' + x + ', ' + y + ')'
  return valid ? png : '(' + png + ')'
}
const originalLayer = new CanvasLayer({ 'maxZoom': MAX_ZOOM, 'tileSize': 2048 })
originalLayer.drawTile = function (canvas: HTMLCanvasElement, tilePoint: LPoint, zoom: number) {
  if (zoom < 5) return // too crowded
  if (tilePoint.x < 0 || tilePoint.x >= (1 << zoom)) return
  if (tilePoint.y < 0 || tilePoint.y >= (1 << zoom)) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.strokeStyle = ctx.fillStyle = 'green'
  const tileSize = 2 << zoom // MAX_ZOOM: 2048, MAX_ZOOM-1: 1024, MAX_ZOOM-2: 512 etc.
  const tileNum = 1 << (MAX_ZOOM - zoom) // MAX_ZOOM: 1, MAX_ZOOM-1: 2, MAX_ZOOM-2: 4, etc.
  for (let x = 0; x < tileNum; ++x) {
    for (let y = 0; y < tileNum; ++y) {
      const xoff = x * tileSize
      const yoff = y * tileSize
      const oFile = originalName(tilePoint.x, tilePoint.y, x, y, zoom)
      if (!oFile) continue
      ctx.strokeRect(xoff, yoff, tileSize, tileSize)
      ctx.fillText(oFile, xoff + 5, yoff + 10)
    }
  }
}

const coordinateLayer = new CanvasLayer({ 'maxZoom': MAX_ZOOM })
coordinateLayer.drawTile = function (canvas: HTMLCanvasElement, tilePoint: LPoint, zoom: number) {
  if (tilePoint.x < 0 || tilePoint.x >= (1 << zoom)) return
  if (tilePoint.y < 0 || tilePoint.y >= (1 << zoom)) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = ctx.fillStyle = 'red'
  ctx.strokeRect(0, 0, 256, 256)
  ctx.fillText('(' + tilePoint.x + ', ' + tilePoint.y + ')', 5, 10)
}

const contentLayer = new CanvasLayer({ 'maxZoom': MAX_ZOOM })
contentLayer.drawTile = function (canvas: HTMLCanvasElement, tilePoint: LPoint, zoom: number) {
  if (!hasTile(zoom, tilePoint.x, tilePoint.y)) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = ctx.fillStyle = 'blue'
  ctx.strokeRect(0, 0, 256, 256)
}

// Layer Group
const baseMaps = { 'xkcd 1110': tileLayer }
const overlayMaps = {
  'File': originalLayer,
  'Coordinates': coordinateLayer,
  'Content': contentLayer
}
L.control.layers(baseMaps, overlayMaps).addTo(map)

// Minimap plugin
new L.Control.MiniMap(tileLayer2, {
  width: 250,
  height: 200,
  // zoomLevelFixed: 2,
  zoomLevelOffset: -4,
  toggleDisplay: true,
  autoToggleDisplay: true
}).addTo(map)

// URL Hash plugin
new L.Hash(map)
