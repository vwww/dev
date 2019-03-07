import 'leaflet'

declare module 'leaflet' {
  class Hash {
    constructor (map: Map)

    parseHash (hash: string): { center: L.LatLng, zoom: number } | false
    formatHash (map: Map): string

    init (map: Map): void
    removeFrom (map: Map): void
  }

  function hash (map: Map): Hash

  interface Map {
    addHash (): void
    removeHash (): void
  }
}
