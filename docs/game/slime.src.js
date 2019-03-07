/* global WebSocket */
(function () {
  var SERVER_PATH = 'wss://s-acrf.rhcloud.com:8443/s'
  // var SERVER_PATH = 'ws://localhost:8080/s'

  var SLIME_SIZE = 0.1
  var BALL_RADIUS = 0.03
  var FLOOR_SIZE = 0.2
  var BG_NUM = 40
  var BG_RADIUS = 0.0375

  var SPAWN_P1_X = 0.45
  var SPAWN_BALL_Y = 0.5

  var fancyBackground = false
  var drawDev = false
  var flipP1 = false

  // ball
  var bx = SPAWN_P1_X
  var by = SPAWN_BALL_Y
  var bxe = 0
  var bye = 0
  var bvx = 0
  var bvy = 0
  var bStatus = 0 // 0: in play, 1: win, 2: loss
  // player1 (object-oriented programming would be so much nicer)
  var p1x = SPAWN_P1_X
  var p1y = 0
  var p1xe = 0
  var p1ye = 0
  var p1name = ''
  var p1color = '#7f0'
  var p1score = 0
  var p1ping = -1
  // player2
  var p2x = 2 - SPAWN_P1_X
  var p2y = 0
  var p2xe = 0
  var p2ye = 0
  var p2name = ''
  var p2color = '#80f'
  var p2score = 0
  var p2ping = -1

  var lastGameTime = Date.now()
  var smoothDelay = 1000

  var canvas = $id('gameCanvas')
  var context = canvas.getContext('2d')
  var fancy = [] // [x, y, vx, vy, r, rgb, a, blur, scale]

  function formatHexColor (v) {
    return '#' + ('00000' + v.toString(16)).slice(-6)
  }

  function makeFancy () {
    return [
      Math.random(),
      Math.random(),
      Math.floor((Math.random() * 7) - 3) / 800 * 0.06,
      Math.floor((Math.random() * 3) + 1) / 400 * 0.06,
      (Math.random() * 0xFFFFFF) | 0,
      (Math.random() * 0.6) + 0.1,
      (Math.floor(Math.random() * 10) + 5) / 2 / 800,
      (Math.random() * 0.7) + 0.3
    ]
  }

  function gameUpdate () {
    var now = Date.now()
    var dt = now - lastGameTime
    smoothDelay = ((smoothDelay * 4) + dt) / 5

    if (!dt) return
    lastGameTime = now

    // TODO apply physics frames
    // move ball

    // move slimers
    // p1x += 0.0001 * dt

    // Exponential moving average for error
    // Move 99.9% in 1 second
    var errMul = Math.pow(0.001, dt / 1000)
    p1xe *= errMul
    p1ye *= errMul
    p2xe *= errMul
    p2ye *= errMul
    bxe *= errMul
    bye *= errMul

    if (!fancyBackground) return

    // move fancy background items
    for (var i = 0; i < fancy.length; ++i) {
      fancy[i][0] += fancy[i][2] * dt
      fancy[i][1] += fancy[i][3] * dt
      // wrap positions around (x)
      if (fancy[i][0] < -BG_RADIUS || fancy[i][0] > 1 + BG_RADIUS) fancy[i][0] %= 1 + (2 * BG_RADIUS)
      if (fancy[i][0] < -BG_RADIUS) fancy[i][0] += 1 + (2 * BG_RADIUS)
      // wrap y around (double radius because aspect ratio is 2)
      if (fancy[i][1] > 1 + (2 * BG_RADIUS) - FLOOR_SIZE) fancy[i][1] -= 1 + (4 * BG_RADIUS) - FLOOR_SIZE
    }
  }

  function drawClear (ctx, W, H) {
    var grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H)
    grd.addColorStop(0, '#0df')
    grd.addColorStop(1, '#26b')

    // Fill with gradient
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  function drawFancy (ctx, W, H) {
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    for (var i = 0; i < fancy.length; ++i) {
      var x = fancy[i][0]
      var y = fancy[i][1]
      var r = fancy[i][4] >> 16
      var g = (fancy[i][4] >> 8) & 0xFF
      var b = fancy[i][4] & 0xFF
      var a = fancy[i][5]
      var blurSize = fancy[i][6]
      var scale = fancy[i][7]
      ctx.beginPath()
      ctx.arc(x * W, y * H, BG_RADIUS * scale * W, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.filter = 'blur(' + (blurSize * scale * W) + 'px)'
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
      ctx.fill()
    }
    ctx.restore()
  }
  function drawFloor (ctx, W, H) {
    ctx.fillStyle = '#999'
    ctx.fillRect(0, H * (1 - FLOOR_SIZE), W, H)
  }
  function drawNet (ctx, W, H) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0.495 * W, 0.625 * H, 0.01 * W, 0.2 * H)
  }
  function drawBall (ctx, W, H, trace) {
    var x = bx
    var y = by
    if (!trace) {
      x += bxe
      y += bye
    }
    if (flipP1) x = 2 - x
    y = (1 - y) - FLOOR_SIZE

    ctx.beginPath()
    ctx.arc(x * H, y * H, BALL_RADIUS * H, 0, 2 * Math.PI)
    ctx.closePath()
    if (trace) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.stroke()
      return
    }
    ctx.fillStyle =
      bStatus === 1
      ? '#0f0'
      : bStatus === 2
      ? 'red'
      : '#ff0'
    ctx.fill()
  }
  function drawSlimer (ctx, W, H, x, y, color, name, p2, trace) {
    // transform to screen space
    if (flipP1) x = 2 - x
    y = (1 - y) - FLOOR_SIZE

    // draw slimer
    ctx.beginPath()
    ctx.arc(x * H, y * H, SLIME_SIZE * H, 0, Math.PI, true)
    ctx.closePath()
    if (trace) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.stroke()
      return
    }
    ctx.fillStyle = color
    ctx.fill()

    // draw eye
    var ex = x + ((flipP1 ^ p2) ? -0.0535 : 0.0535)
    var ey = y - 0.0525
    ctx.beginPath()
    ctx.arc(ex * H, ey * H, 0.0175 * H, 0, 2 * Math.PI, true)
    ctx.closePath()
    ctx.fillStyle = '#fff'
    ctx.fill()
    // draw pupil
    var dx = (flipP1 ? 2 - bx - bxe : bx + bxe) - ex
    var dy = ((1 - by - bye) - FLOOR_SIZE) - ey
    var l2 = (dx * dx) + (dy * dy)
    if (l2 > 0.005 * 0.005) {
      var f = 0.005 / Math.sqrt(l2)
      ex += dx * f
      ey += dy * f
    } else {
      ex = bx + bxe
      ey = by + bye
    }
    ctx.beginPath()
    ctx.arc(ex * H, ey * H, 0.01 * H, 0, 2 * Math.PI, true)
    ctx.closePath()
    ctx.fillStyle = '#000'
    ctx.fill()

    // draw nametag
    if (name) {
      ctx.font = (0.0225 * W) + 'px Verdana, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ccc'
      ctx.fillText(name, x * H, (y - 0.05 - SLIME_SIZE) * H)
    }
  }
  function drawScore (ctx, W, H) {
    ctx.font = (0.05 * W) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fd0'
    ctx.fillText(p1score, (flipP1 ? 0.92 : 0.08) * W, 0.15 * H)
    ctx.fillText(p2score, (flipP1 ? 0.08 : 0.92) * W, 0.15 * H)
  }
  function drawStatus (ctx, W, H, status) {
    ctx.font = (0.04 * W) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ddd'
    ctx.fillText(status, 0.5 * W, 0.15 * H)
  }
  function drawFPS (ctx, W, H) {
    var fps = 1000 / Math.max(smoothDelay, 0.5)

    ctx.font = (0.02 * W) + 'px monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#fa0'
    ctx.fillText(Math.round(fps) + ' fps', 0.01 * W, 0.97 * H)
  }
  function drawPing (ctx, W, H, ping, left) {
    if (ping < 0) return

    ctx.font = (0.02 * W) + 'px monospace'
    ctx.textAlign = left ? 'left' : 'right'
    ctx.fillStyle = '#fa0'
    ctx.fillText(ping + ' ms', (left ? 0.01 : 0.99) * W, 0.85 * H)
  }
  function redraw (ctx) {
    var H = ctx.canvas.height
    var W = H * 2

    // background
    drawClear(ctx, W, H)
    if (fancyBackground) {
      drawFancy(ctx, W, H)
    }

    // draw net
    drawFloor(ctx, W, H)
    drawNet(ctx, W, H)

    // draw dynamic entities
    drawBall(ctx, W, H)
    drawSlimer(ctx, W, H, p1x + p1xe, p1y + p1ye, p1color, p1name, false)
    if (sock && hasOpponent) {
      drawSlimer(ctx, W, H, p2x + p2xe, p2y + p2ye, p2color, p2name, true)
      drawPing(ctx, W, H, p1ping, !flipP1)
      drawPing(ctx, W, H, p2ping, flipP1)
    }

    // draw true positions
    if (drawDev) {
      drawBall(ctx, W, H, true)
      drawSlimer(ctx, W, H, p1x, p1y, p1color, p1name, false, true)
      drawSlimer(ctx, W, H, p2x, p2y, p2color, p2name, true, true)
    }

    // draw HUD
    drawScore(ctx, W, H)
    var status
    if (!sock) {
      status = 'Disconnected'
    } else if (sock.readyState === 0) {
      status = 'Connecting'
    } else if (sock.readyState === 2) {
      status = 'Disconnecting'
    } else if (!hasOpponent) {
      status = 'Waiting for opponent'
    } else if (bStatus === 1) {
      status = 'You won the round!'
    } else if (bStatus === 2) {
      status = 'You lost the round!'
    }
    if (status) drawStatus(ctx, W, H, status)
    drawFPS(ctx, W, H)
  }

  function drawFrame () {
    window.requestAnimationFrame(drawFrame)
    gameUpdate()
    netUpdate()
    redraw(context)
  }

  function resizeCanvas () {
    // if (document.fullscreen && document.fullscreenElement === canvas)
    if (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) {
      // fullscreen mode
      canvas.width = Math.min(window.innerWidth, window.innerHeight * 2)
      canvas.height = Math.min(window.innerHeight, window.innerWidth / 2)
    } else {
      canvas.width = Math.min(canvas.parentNode.clientWidth, canvas.parentNode.clientHeight * 2)
      canvas.height = Math.min(canvas.parentNode.clientHeight, canvas.parentNode.clientWidth / 2)
    }
  }

  var sock
  var hasOpponent = false
  var lastKeySent = -1

  function connect () {
    sock = new WebSocket(SERVER_PATH)
    sock.binaryType = 'arraybuffer'
    sock.onopen = connected
    sock.onmessage = received
    sock.onclose = disconnected
    sock.onerror = disconnected

    hasOpponent = false
    $id('pName').disabled = true
    $id('pColor').disabled = true
    $id('connect').innerHTML = 'Disconnect'
    $id('connect').className = 'btn btn-danger'
  }

  function disconnect () {
    sock.close()
  }

  function disconnected () {
    sock = undefined
    p1ping = -1
    p2ping = -1
    $id('pName').disabled = false
    $id('pColor').disabled = false
    $id('connect').innerHTML = 'Connect'
    $id('connect').className = 'btn btn-primary'
  }

  function connected () {
    var name = getUserName()
    var color = getUserColor()

    var buf = new ArrayBuffer(name.length + 3)
    var dv = new DataView(buf)

    dv.setUint16(0, color >> 8)
    dv.setUint8(2, color & 0xFF)
    str2buf(buf, name, 3)

    sock.send(buf)
  }

  function received (event) {
    var data = event.data
    var dv = new DataView(data)

    var type = dv.getUint8(0)
    if (!type) {
      // welcome
      p1color = formatHexColor(dv.getUint32(0))
      p1name = buf2str(data, 4)
    } else if (type === 1) {
      // state
      var DMF = 0xFFFF
      var DVF = 0x3FFF

      var xn = dv.getUint16(2) / DMF
      var yn = dv.getUint16(4) / DMF
      p1xe += p1x - xn
      p1ye += p1y - yn
      p1x = xn
      p1y = yn
      // p1vy = dv.getInt16(6) / DMF

      xn = 2 - (dv.getUint16(8) / DMF)
      yn = dv.getUint16(10) / DMF
      p2xe += p2x - xn
      p2ye += p2y - yn
      p2x = xn
      p2y = yn
      // p2vy = dv.getInt16(12) / DMF

      xn = dv.getUint16(14) / DMF * 2
      yn = dv.getUint16(16) / DMF
      // p2vx = dv.getInt16(18) / DMF
      // p2vy = dv.getInt16(20) / DMF
      bxe += bx - xn
      bye += by - yn
      bx = xn
      by = yn
    } else if (type === 2) {
      // enter
      hasOpponent = true
      p1score = p2score = 0

      p2color = formatHexColor(dv.getUint32(0) & 0xFFFFFF)
      p2name = buf2str(data, 4)

      // start sending when opponent enters
      lastKeySent = -1
    } else if (type === 3) {
      // leave
      hasOpponent = false
    } else if (type === 4) {
      // win
      p1score++
      bStatus = 1
    } else if (type === 5) {
      // lose
      p2score++
      bStatus = 2
    } else if (type === 6 || type === 7) {
      // next round
      p1x = SPAWN_P1_X
      p1y = 0
      p1xe = 0
      p1ye = 0
      p2x = 2 - SPAWN_P1_X
      p2y = 0
      p2xe = 0
      p2ye = 0

      bx = type === 6 ? p1x : p2x
      by = SPAWN_BALL_Y
      bxe = 0
      bye = 0
      bvx = 0
      bvy = 0
      bStatus = 0
    } else if (type === 8) {
      // ping times
      p1ping = dv.getUint8(1) | ((dv.getUint8(2) & 0xF0) << 4)
      p2ping = dv.getUint8(3) | ((dv.getUint8(2) & 0x0F) << 8)
    } else if (type === 9 && data.byteLength === 9) {
      sock.send(data.slice(1))
    }
  }

  function buf2str (buf, offset) {
    return String.fromCharCode.apply(null, new Uint8Array(buf, offset))
  }

  function str2buf (buf, str, offset) {
    var a = new Uint8Array(buf, offset)
    for (var i = 0, len = str.length; i < len; ++i) {
      a[i] = str.charCodeAt(i)
    }
  }

  function netUpdate () {
    if (!sock) return

    // don't bother to send keep-alives

    if (!hasOpponent) return

    var keyFlags = KeyFlags
    if (MouseValid) {
      if (!(keyFlags & 3) && Math.abs(p1x - MouseX) > 0.05) {
        keyFlags |= p1x < MouseX ? 2 : 1
      }
      if (MouseYJump) keyFlags |= 4
    }
    if (lastKeySent !== keyFlags) {
      var buf = new Uint8Array(1)
      buf[0] = (lastKeySent = keyFlags)
      sock.send(buf.buffer)
    }
  }

  // user inputs
  function getUserName () { return $id('pName').value }
  function getUserColor () {
    var color = parseInt($id('pColor').value, 16)
    return Number.isNaN(color) ? 0x77ff00 : color & 0xFFFFFF
  }
  var Key = {}
  var KeyFlags = 0
  function KeyL () { return Key[37] || Key[65] }
  function KeyU () { return Key[38] || Key[87] }
  function KeyR () { return Key[39] || Key[68] }
  function KeyUpdateFlags () {
    var L = flipP1 ? KeyR : KeyL
    var R = flipP1 ? KeyL : KeyR
    KeyFlags = (L() | 0) | (R() << 1) | (KeyU() << 2)
  }
  var MouseX
  var MouseYJump = false
  var MouseValid = false

  // ready function
  document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas()
    for (var i = 0; i < BG_NUM; ++i) {
      fancy.push(makeFancy())
    }
    window.requestAnimationFrame(drawFrame)

    // event listeners
    function movestart (x, y) {
      MouseValid = true
      MouseX = (x - canvas.getBoundingClientRect().left) / canvas.width
      if (flipP1) MouseX = 1 - MouseX
      MouseX = Math.min(Math.max(MouseX * 2, 0), 1)
      MouseYJump = y - canvas.getBoundingClientRect().top < canvas.height * 0.45
    }
    function movestop (event) {
      MouseValid = false
    }
    function touchmove (event) {
      if (event.targetTouches.length < 1) return

      event.preventDefault()

      var touch = event.targetTouches.item(0)
      movestart(touch.clientX, touch.clientY)
    }
    canvas.addEventListener('mousemove', function (event) { movestart(event.clientX, event.clientY) })
    canvas.addEventListener('touchmove', touchmove)
    canvas.addEventListener('mouseleave', movestop)
    canvas.addEventListener('touchend', movestop)
    canvas.addEventListener('touchcancel', movestop)
    $id('connect').addEventListener('click', function () {
      (sock ? disconnect : connect)()
    })
    $id('fullscreen').addEventListener('click', function () {
      // checkbox for fullscreen will be invisible
      $id('fullscreen').checked = false

      var fullscreenFunc
      ['requestFullScreen',
        'mozRequestFullScreen',
        'msRequestFullscreen',
        'webkitRequestFullScreen'].forEach(function (req) {
          fullscreenFunc = fullscreenFunc || canvas[req]
        })
      if (fullscreenFunc) fullscreenFunc.call(canvas)
    })
    $id('pName').addEventListener('change', function () {
      if (!sock) p1name = this.value
      window.localStorage.n = this.value
    })
    $id('pColor').addEventListener('change', function () {
      if (!sock) p1color = formatHexColor(parseInt(this.value, 16))
      window.localStorage.c = this.value
    })
    $id('flipP1').addEventListener('change', function () {
      flipP1 = this.checked
      window.localStorage.f = flipP1 ? '1' : '0'
      KeyUpdateFlags()
    })
    $id('notFlipP1').addEventListener('change', function () {
      flipP1 = !this.checked
      window.localStorage.f = flipP1 ? '1' : '0'
      KeyUpdateFlags()
    })
    $id('background').addEventListener('change', function () {
      fancyBackground = this.checked
      window.localStorage.b = this.checked ? '1' : '0'
    })
    $id('devMode').addEventListener('change', function () {
      drawDev = this.checked
      window.localStorage.d = this.checked ? '1' : '0'
    })
    window.addEventListener('keydown', function (event) {
      Key[event.keyCode] = true
      KeyUpdateFlags()
    })
    window.addEventListener('keyup', function (event) {
      delete Key[event.keyCode]
      KeyUpdateFlags()
    })
    document.addEventListener('fullscreenchange', function () {
      resizeCanvas()
    })
    window.addEventListener('resize', function () {
      resizeCanvas()
    })

    // restore settings
    if (window.localStorage.n) p1name = $id('pName').value = window.localStorage.n
    if (window.localStorage.c) p1color = formatHexColor($id('pColor').value = window.localStorage.c)
    if (window.localStorage.f === '1') flipP1 = $id('flipP1').checked = true
    if (window.localStorage.b === '1') fancyBackground = $id('background').checked = true
    if (window.localStorage.d === '1') drawDev = $id('devMode').checked = true
  })

  function $id (x) { return document.getElementById(x) }
})()
