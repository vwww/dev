import $ from 'jquery'

function resizeTagCloud (): void {
  if (!$('.tag-cloud').length) {
    return
  }

  // Count
  let numMin = Number.MAX_VALUE
  let numMax = Number.MIN_VALUE

  $('.tag-cloud a').each(function () {
    const num = parseInt($(this).find('sup').text()) || 1
    numMin = Math.min(numMin, num)
    numMax = Math.max(numMax, num)
  })

  // Set sizes based on the counts
  if (numMin > numMax) {
    return
  }

  const sizeMin = 50
  const sizeGrow = 100 // 50-150

  const sizeMult = sizeGrow / Math.sqrt(numMax - numMin + 1)
  $('.tag-cloud a').each(function () {
    const num = parseInt($(this).find('sup').text()) || 1
    $(this).css('font-size', (sizeMin + Math.sqrt(num - numMin + 1) * sizeMult) + '%')
  })
}

$(resizeTagCloud)
