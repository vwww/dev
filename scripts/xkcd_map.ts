// from other repo
declare const available: Record<string, string[]>

// declare const L: typeof import('leaflet')
declare const L: any
type LPoint = { x: number, y: number }

// Map
var START_POS = new L.LatLng(1.1, 0.2)
const MAX_ZOOM = 10 // also the maximum
var map = L.map('map', { center: START_POS, zoom: MAX_ZOOM, fullscreenControl: true })

// Attribution
map.attributionControl.setPrefix('') // move prefix to last attribution
map.attributionControl.addAttribution('<span id="attribution"><a href="//victorz.ca">Victor</a>&rsquo;s zoomable visualization of <a href="https://xkcd.com/1110/" rel="external nofollow">xkcd: Click and Drag</a></span> (<a href="https://creativecommons.org/licenses/by-nc/2.5/">CC-BY-NC 2.5</a>)')
map.attributionControl.addAttribution('inspired by <a href="http://xkcd-map.rent-a-geek.de">dividuum</a>\'s map')
map.attributionControl.addAttribution('images served by <a href="https://github.com">GitHub</a> (with <a href="https://www.fastly.com">Fastly</a>)')
map.attributionControl.addAttribution('<script id="_wau_target"></script>')
map.attributionControl.addAttribution('powered by <a href="http://leafletjs.com">Leaflet</a>')

// Online
;(window as any)._wau = ['small', 'xvictorx', '_target']
;(function () {
  var s = document.createElement('script')
  s.async = true
  s.src = 'http://widgets.amung.us/small.js'
  document.getElementsByTagName('head')[0].appendChild(s)
})()

// Hide .autoclose on drag
map.on('dragstart',
  function dragstartHook () {
    var target = document.getElementById('autoclose')!
    if (target.parentNode) target.parentNode.removeChild(target)
    map.off('dragstart', dragstartHook)
  }
)

// Hide #intro on move
map.on('movestart',
  function movestartHook () {
    document.getElementById('intro')!.style.display = 'none'
    map.off('movestart', movestartHook)
  }
)

// Tiles
var STILE_URL = 'https://vwww.github.io/xkcd-map/'
var LAYER_URL = 'https://vwww.github.io/xkcd-map/converted/{z}-{x}-{y}.png'

function hasTile (zoom: string | number, x: number, y: number) {
  return zoom in available && available[zoom].indexOf(x + '-' + y) !== -1
}

var tileLayer = L.tileLayer(LAYER_URL, {
  maxZoom: MAX_ZOOM,
  continuousWorld: true,
  subdomains: '1234567890'
})
var tileLayer2 = L.tileLayer(LAYER_URL, {
  minZoom: 2,
  maxZoom: 4,
  continuousWorld: true,
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

  var blockName = 'ground'
  if (zoom) {
    if (tilePoint.y < (1 << (zoom - 1))) blockName = 'sky'
  } else {
    if (!tilePoint.y) blockName = 'split'
    if (tilePoint.y < 0) blockName = 'sky'
  }
  return STILE_URL + blockName + '.png'
}
tileLayer.addTo(map)

// Tile Highlighting layers
var originalLayer = L.tileLayer.canvas({'maxZoom': MAX_ZOOM, 'tileSize': 2048})
function originalName (tx: number, ty: number, x: number, y: number, zoom: number) {
  var newx: string | number = (tx << (MAX_ZOOM - zoom)) + x - (1 << (MAX_ZOOM - 4))
  if (newx < -33 || newx >= 48) return false // 81 frames wide (33 West - 48 East)
  if (newx >= 0) newx = (newx + 1) + 'e'
  else newx = (-newx) + 'w'
  var newy: string | number = (ty << (MAX_ZOOM - zoom)) + y - (1 << (MAX_ZOOM - 4))
  if (newy < -19 || newy >= 13) return false // 32 frames tall (13 North - 19 South)
  if (newy >= 0) newy = (newy + 1) + 's'
  else newy = (-newy) + 'n'
  return newy + newx + '.png' // ' (' + tx + ', ' + ty + ' / ' + x + ', ' + y + ')'
}
originalLayer.drawTile = function (canvas: HTMLCanvasElement, tilePoint: LPoint, zoom: number) {
  if (zoom < 5) return // too crowded
  // if(tilePoint.x < 31 || tilePoint.x > 111) return; // TODO: add optimizer
  if (tilePoint.x < 0 || tilePoint.x >= (1 << zoom)) return
  var ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.strokeStyle = ctx.fillStyle = 'green'
  var tileSize = 2 << zoom // MAX_ZOOM: 2048, MAX_ZOOM-1: 1024, MAX_ZOOM-2: 512 etc.
  var tileNum = 1 << (MAX_ZOOM - zoom) // MAX_ZOOM: 1, MAX_ZOOM-1: 2, MAX_ZOOM-2: 4, etc.
  for (var x = 0; x < tileNum; ++x) {
    for (var y = 0; y < tileNum; ++y) {
      var xoff = x * tileSize
      var yoff = y * tileSize
      var oFile = originalName(tilePoint.x, tilePoint.y, x, y, zoom)
      if (!oFile) continue
      ctx.strokeRect(xoff, yoff, tileSize, tileSize)
      ctx.fillText(oFile, xoff + 5, yoff + 10)
    }
  }
}

var coordinateLayer = L.tileLayer.canvas({'maxZoom': MAX_ZOOM})
coordinateLayer.drawTile = function (canvas: HTMLCanvasElement, tilePoint: LPoint, zoom: number) {
  if (tilePoint.x < 0 || tilePoint.x >= (1 << zoom)) return
  var ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = ctx.fillStyle = 'red'
  ctx.strokeRect(0, 0, 256, 256)
  ctx.fillText('(' + tilePoint.x + ', ' + tilePoint.y + ')', 5, 10)
}

var contentLayer = L.tileLayer.canvas({'maxZoom': MAX_ZOOM})
contentLayer.drawTile = function (canvas: HTMLCanvasElement, tilePoint: LPoint, zoom: number) {
  if (!hasTile(zoom, tilePoint.x, tilePoint.y)) return
  var ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = ctx.fillStyle = 'blue'
  ctx.strokeRect(0, 0, 256, 256)
}

// Layer Group
var baseMaps = {'xkcd 1110': tileLayer}
var overlayMaps = {
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
