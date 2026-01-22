function resizeTagCloud (): void {
  const clouds = document.getElementsByClassName('tag-cloud')
  if (!clouds.length) {
    return
  }

  // Count
  let numMin = Number.MAX_VALUE
  let numMax = Number.MIN_VALUE

  for (const cloud of clouds) {
    for (const a of cloud.children) {
      const num = parseInt(a.lastElementChild?.textContent!) || 1
      numMin = Math.min(numMin, num)
      numMax = Math.max(numMax, num)
    }
  }

  // Set sizes based on the counts
  if (numMin > numMax) {
    return
  }

  const sizeMin = 50
  const sizeGrow = 100 // 50-150

  const sizeMult = sizeGrow / Math.sqrt(numMax - numMin + 1)
  for (const cloud of clouds) {
    for (const a of cloud.children) {
      const num = parseInt(a.lastElementChild?.textContent!) || 1
      ;(a as HTMLElement).style.fontSize = (sizeMin + Math.sqrt(num - numMin + 1) * sizeMult) + '%'
    }
  }
}

document.addEventListener('DOMContentLoaded', resizeTagCloud)
