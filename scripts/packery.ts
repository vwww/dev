$(function () {
  const $gridContainer = $('.grid-container')
  if ($gridContainer.length) {
    $gridContainer.packery({
      itemSelector: '.grid-item'
    })
  }
})
