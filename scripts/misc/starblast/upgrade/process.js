// run this after setting `ships`

function calcDamage (lasers) {
  let a = 0
  let b = 0
  for (let l of lasers) {
    a += l.damage[0] * l.rate * l.number
    b += l.damage[1] * l.rate * l.number
  }
  return [a, b]
}

JSON.stringify(ships.map(JSON.parse).map(s => [s.name, s.level, s.model, s.specs.generator.reload, calcDamage(s.typespec.lasers)]))
