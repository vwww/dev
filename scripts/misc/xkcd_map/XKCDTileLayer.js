L.XKCDTileLayer = L.TileLayer.extend({
  initialize (options) {
    L.TileLayer.prototype.initialize.call(this, '', options)
  },

  getTileUrl (coords) {
    const TILE_URL = 'https://vwww.github.io/xkcd-map/'

    const { x, y, z: zoom } = coords
    if (this.options.hasTile(zoom, x, y)) {
      return `${TILE_URL}converted/${zoom}-${x}-${y}.png`
    }

    let blockName = 'ground'
    if (zoom) {
      if (y < (1 << (zoom - 1))) blockName = 'sky'
    } else {
      if (!y) blockName = 'split'
      if (y < 0) blockName = 'sky'
    }
    return `${TILE_URL}${blockName}.png`
  }
})

L.xkcdTileLayer = function (options) {
  return new L.XKCDTileLayer(options)
}
