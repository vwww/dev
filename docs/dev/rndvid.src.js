;(function () {
  var canvas = document.getElementById('viewport')
  var context, imagedata

  function getW () {
    if (document.documentElement && document.documentElement.clientWidth) {
      return document.documentElement.clientWidth
    } else if (document.body) {
      return document.body.clientWidth
    }
  }

  function getH () {
    if (document.documentElement && document.documentElement.clientHeight) {
      return document.documentElement.clientHeight
    } else if (document.body) {
      return document.body.clientHeight
    }
  }

  function resizeCanvas () {
    canvas.width = Math.min(getW(), 1280)
    canvas.height = Math.min(getH(), 720)

    context = canvas.getContext('2d')
    imagedata = context.createImageData(canvas.width, canvas.height)
  }

  document.addEventListener('DOMContentLoaded', function () {
    function makeImage () {
      for (var i = (canvas.width * canvas.height << 2) - 1; i; --i) {
        imagedata.data[i] = !(~i & 3) ? 255 : Math.floor(Math.random() * 255)
      }
    }

    // Render loop
    // var lastRender = Date.now()
    function render (timestamp) {
      window.requestAnimationFrame(render)

      // var now = Date.now()
      // if (now < lastRender + 100) return

      makeImage()
      context.putImageData(imagedata, 0, 0)
    // lastRender = now - ((now - lastRender) % 100)
    }

    resizeCanvas()
    render()
  })

  window.onresize = resizeCanvas
})()
