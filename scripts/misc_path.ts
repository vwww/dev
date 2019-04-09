import { $idA } from './util'

declare function svgPanZoom (selector: string | HTMLElement, options?: object): void

const $pathSVG = $idA('pathSVG')
$pathSVG.addEventListener('load', () => {
  svgPanZoom($pathSVG, {
    zoomEnabled: true,
    controlIconsEnabled: true,
    fit: true,
    center: true,
  })
})
