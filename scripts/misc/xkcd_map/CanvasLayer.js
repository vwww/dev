L.CanvasLayer = L.GridLayer.extend({
  createTile: function (coords) {
    const tile = document.createElement('canvas')

    const tileSize = this.getTileSize()
    tile.setAttribute('width', tileSize.x)
    tile.setAttribute('height', tileSize.y)

    const ctx = tile.getContext('2d')

    this.options.drawTile(ctx, coords)

    return tile
  }
})

L.canvasLayer = function (options) {
  return new L.CanvasLayer(options)
}
