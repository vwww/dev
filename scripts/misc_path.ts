import { $idA } from './util'

import svgPanZoom from 'svg-pan-zoom'

const $pathSVG = $idA('pathSVG')
$pathSVG.addEventListener('load', () => {
  svgPanZoom($pathSVG, {
    zoomEnabled: true,
    controlIconsEnabled: true,
    fit: true,
    center: true,
  })
})
