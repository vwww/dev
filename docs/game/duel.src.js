/* global WebSocket */
(function () {
  var SERVER_PATH = 'wss://d-acrf.rhcloud.com:8443/d'
  // var SERVER_PATH = 'ws://localhost:8080/d'

  var MAXX = 1600
  var MAXY = 900
  var LEADERBOARD_NUM = 5
  var PLAYERS_NUM = 256

  var showFPS = true
  var drawDev = true

  var canvas = $id('gameCanvas')
  var context = canvas.getContext('2d')

  var lastGameTime = Date.now()
  var lastPhysFrame = Date.now()
  var smoothDelay = 1000
  var player1
  var players = (function () {
    var p = new Array(PLAYERS_NUM)
    for (var i = 0; i < PLAYERS_NUM; ++i) {
      p[i] = {
        type: 0,
        name: '',
        color: 'black',
        kills: 0,
        deaths: 0,
        combo: 0,
        score: 0,

        // game state
        alive: 0,
        // position vector
        x: 0,
        y: 0,
        // position error vector
        ex: 0,
        ey: 0,
        // destination vector
        dx: 0,
        dy: 0,
        // size
        m: 1000,
        r: 10
      }
    }
    return p
  })()

  function gameUpdate () {
    var now = Date.now()
    var dt = now - lastGameTime
    smoothDelay = ((smoothDelay * 4) + dt) / 5

    if (!dt) return
    lastGameTime = now

    // Exponential moving average for error
    // Move 99.9% in 1 second
    var errMul = Math.pow(0.001, dt / 1000)
    for (var i = 0; i < players.length; ++i) {
      var p = players[i]
      if (p.alive) {
        p.ex *= errMul
        p.ey *= errMul
      }
    }

    while (lastPhysFrame < now) {
      for (i = 0; i < players.length; ++i) {
        p = players[i]
        // predict player positions
        var dx = p.dx - p.x
        var dy = p.dy - p.y
        var MOVE_SPEED = 200 / 50
        var l2 = (dx * dx) + (dy * dy)
        if (l2 > MOVE_SPEED * MOVE_SPEED) {
          var factor = MOVE_SPEED / Math.sqrt(l2)
          dx *= factor
          dy *= factor
        }
        p.x += dx
        p.y += dy
      }
      lastPhysFrame += 20
    }
  }

  function drawClear (ctx, W, H) {
    ctx.fillStyle = '#37c'
    ctx.fillRect(0, 0, W, H)
  }
  function drawPlayer (ctx, W, H, p, local) {
    var x = p.x + p.ex
    var y = p.y + p.ey
    // draw body
    ctx.beginPath()
    ctx.arc(x / MAXX * W, y / MAXY * H, p.r / MAXX * W, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = p.color
    ctx.fill()

    if (drawDev) {
      // draw true position
      ctx.beginPath()
      ctx.arc(p.x / MAXX * W, p.y / MAXY * H, p.r / MAXX * W, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.stroke()
      // show destination
      var grd = ctx.createLinearGradient(
        p.x / MAXX * W,
        p.y / MAXY * H,
        p.dx / MAXX * W,
        p.dy / MAXY * H
      )
      grd.addColorStop(0, 'red')
      grd.addColorStop(1, 'rgba(255,0,0,0.25)')

      ctx.strokeStyle = grd
      ctx.moveTo(p.x / MAXX * W, p.y / MAXY * H)
      ctx.lineTo(p.dx / MAXX * W, p.dy / MAXY * H)
      ctx.stroke()
    }

    // draw battle chance
    if (player1 && player1.alive && p !== player1) {
      var dx = player1.x + player1.ex - x
      var dy = player1.y + player1.ey - y

      var l2 = (dx * dx) + (dy * dy)
      if (l2 > p.r * p.r) {
        var f = p.r / Math.sqrt(l2)
        dx *= f
        dy *= f
      }

      var pr = 10 + (player1.m / (player1.m + p.m) * 80)
      if (p.type === 2) pr = 90 + (pr * 0.1)

      ctx.font = (0.015 * W) + 'px Verdana, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = pr > 70 ? '#0f0' : pr < 40 ? '#f00' : '#aaa'
      ctx.fillText(Math.round(pr) + '%', (x + dx) / MAXX * W, (y + dy) / MAXY * H)
    }

    // draw nametag
    ctx.font = (0.015 * W) + 'px Verdana, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (p.name) {
      ctx.fillStyle = '#ccc'
      ctx.fillText(p.name, x / MAXX * W, ((y / MAXY) - 0.01) * H)
    }
    ctx.fillStyle = '#eee'
    ctx.fillText(p.m.toLocaleString(), x / MAXX * W, ((y / MAXY) + 0.01) * H)
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
  function redraw (ctx) {
    var H = ctx.canvas.height
    var W = ctx.canvas.width

    drawClear(ctx, W, H)
    for (var i = 0; i < PLAYERS_NUM; ++i) {
      var p = players[i]
      if (p.type && p.alive) drawPlayer(ctx, W, H, p)
    }

    // draw HUD
    var status
    if (!sock) {
      status = 'Disconnected'
    } else if (sock.readyState === 0) {
      status = 'Connecting'
    } else if (sock.readyState === 2) {
      status = 'Disconnecting'
    } else if (player1) {
      status = player1.score +
        ' (' + player1.kills + '/' + player1.deaths + ') [' +
        player1.combo + 'x COMBO]'
    }
    if (status) drawStatus(ctx, W, H, status)
    if (showFPS) drawFPS(ctx, W, H)
  }

  function drawFrame () {
    window.requestAnimationFrame(drawFrame)
    gameUpdate()
    redraw(context)
  }

  function resizeCanvas () {
    if (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) {
      // fullscreen mode
      canvas.width = Math.min(window.innerWidth, window.innerHeight * MAXX / MAXY)
      canvas.height = Math.min(window.innerHeight, window.innerWidth * MAXY / MAXX)
    } else {
      canvas.width = Math.min(canvas.parentNode.clientWidth, canvas.parentNode.clientHeight * MAXX / MAXY)
      canvas.height = Math.min(canvas.parentNode.clientHeight, canvas.parentNode.clientWidth * MAXY / MAXX)
    }
  }

  var sock
  var lastSentX = -1
  var lastSentY = -1

  function connect () {
    sock = new WebSocket(SERVER_PATH)
    sock.binaryType = 'arraybuffer'
    sock.onopen = connected
    sock.onmessage = received
    sock.onclose = disconnected

    $id('connect').innerHTML = 'Disconnect'
    $id('connect').className = 'btn btn-danger'
  }

  function disconnect () {
    sock.close()
  }

  function disconnected () {
    sock = undefined
    player1 = undefined
    $id('connect').innerHTML = 'Connect'
    $id('connect').className = 'btn btn-primary'
  }

  function connected () {
    // reset players
    for (var i = 0; i < players.length; ++i) {
      players[i].type = 0
    }

    // send hello
    var name = getUserName()
    var color = getUserColor()

    var buf = new ArrayBuffer(name.length + 1)
    var dv = new DataView(buf)

    dv.setUint8(0, color)
    str2buf(buf, name, 1)

    sock.send(buf)
  }

  function received (event) {
    var data = event.data
    var dv = new DataView(data)

    var type = dv.getUint8(0)
    if (!type) {
      receiveWelcome(dv)
    } else if (type === 1 || type === 2) {
      receiveEnter(dv, data, type)
    } else if (type === 3) {
      // leave
      var cn = dv.getUint8(1)
      players[cn].type = 0
    } else if (type === 4) {
      receiveWorldState(dv)
    } else if (type === 5) {
      receiveDeath(dv)
    } else if (type === 6) {
      receivePingTimes(dv)
    } else if (type === 7 && data.byteLength === 9) {
      // ping
      sock.send(data.slice(1))
    }
  }
  function receiveWelcome (dv) {
    // welcome
    var cn = dv.getUint8(1)
    player1 = players[cn]
    player1.type = 1
    player1.kills = 0
    player1.deaths = 0
    player1.combo = 0
    player1.score = 0
    player1.alive = false
    player1.name = filterName(getUserName())
    player1.color = formatColor(getUserColor(), 0)
  }
  function receiveEnter (dv, data, type) {
    var cn = dv.getUint8(1)
    var k = dv.getUint32(2)
    var d = dv.getUint32(6)
    var c = dv.getUint32(10)
    var s = dv.getUint32(14)
    var col = dv.getUint8(18)
    var name = buf2str(dv.buffer, 19)

    var p = players[cn]
    p.type = type
    p.kills = k
    p.deaths = d
    p.combo = c
    p.score = s
    p.alive = false
    p.name = filterName(name)
    p.color = formatColor(col, type)
  }
  function receiveWorldState (dv) {
    // world state
    for (var i = 1; i + 13 <= dv.byteLength; i += 13) {
      var cn = dv.getUint8(i)
      var x = dv.getUint16(i + 1) * MAXX / 0xFFFF
      var y = dv.getUint16(i + 3) * MAXY / 0xFFFF
      var dx = dv.getUint16(i + 5) * MAXX / 0xFFFF
      var dy = dv.getUint16(i + 7) * MAXY / 0xFFFF
      var m = dv.getUint32(i + 9)
      var p = players[cn]
      p.m = m
      p.r = Math.sqrt(m)
      if (!p.alive) {
        p.alive = true
        p.ex = 0
        p.ey = 0
      } else {
        p.ex += p.x - x
        p.ey += p.y - y
      }
      p.x = x
      p.y = y
      p.dx = dx
      p.dy = dy
    }
  }
  function receiveDeath (dv) {
    // death
    var killer = dv.getUint8(1)
    var victim = dv.getUint8(2)
    var k = players[killer]
    var v = players[victim]
    k.kills += 1
    k.combo += 1
    v.deaths += 1
    v.alive = false
    v.combo = 0
    if (killer === victim) {
      k.score--
    } else {
      k.score += k.combo
    }
  }
  function receivePingTimes (dv) {
    // ping time
    for (var i = 1; i + 3 <= dv.byteLength; i += 3) {
      var cn = dv.getUint8(i)
      players[cn].ping = dv.getUint16(i + 1)
    }
  }

  function buf2str (buf, offset, length) {
    return String.fromCharCode.apply(null, new Uint8Array(buf, offset, length))
  }

  function str2buf (buf, str, offset) {
    var a = new Uint8Array(buf, offset)
    for (var i = 0, len = str.length; i < len; ++i) {
      a[i] = str.charCodeAt(i)
    }
  }

  function netUpdate () {
    if (!sock || sock.readyState !== 1 || !player1) return

    // Send desired position
    if (Math.abs(moveX - lastSentX) > 0.01 ||
    Math.abs(moveY - lastSentY) > 0.01) {
      var buf = new ArrayBuffer(4)
      var dv = new DataView(buf)
      dv.setUint16(0, ((lastSentX = moveX) * 0xFFFF) | 0)
      dv.setUint16(2, ((lastSentY = moveY) * 0xFFFF) | 0)
      sock.send(buf)
    }

    // FUTURE: send spawn request
  }

  // user inputs
  var moveX = 0
  var moveY = 0
  function getUserName () { return $id('pName').value }
  function getUserColor () {
    var color = parseInt($id('pColor').value, 16)
    if (Number.isNaN(color)) color = Math.random() * 0xFF
    return color & 0xFF
  }
  function filterName (name) {
    // let the server do the filtering
    return name
  }
  function formatColor (color, type) {
    var hue = color * (360 / 0x100)
    var sl = !type ? '90%,60%' : type === 1 ? '80%,40%' : '40%,20%'
    return 'hsl(' + hue + ',' + sl + ')'
  }

  document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas()
    window.requestAnimationFrame(drawFrame)

    // event listeners
    function movestart (x, y) {
      moveX = (x - canvas.getBoundingClientRect().left) / canvas.width
      moveY = (y - canvas.getBoundingClientRect().top) / canvas.height
    }
    function movestop (event) {
      // stop moving
      if (player1) {
        moveX = player1.x / MAXX
        moveY = player1.y / MAXY
      }
    }
    function touchmove (event) {
      if (event.targetTouches.length < 1) return

      event.preventDefault()

      var touch = event.targetTouches.item(0)
      movestart(touch.clientX, touch.clientY)
    }
    canvas.addEventListener('mousemove', function (event) { movestart(event.clientX, event.clientY) })
    canvas.addEventListener('touchstart', touchmove)
    canvas.addEventListener('touchmove', touchmove)
    canvas.addEventListener('mouseleave', movestop)
    canvas.addEventListener('touchend', movestop)
    canvas.addEventListener('touchcancel', movestop)
    $id('hue').addEventListener('click', function (event) {
      var hue = (event.clientX - event.target.getBoundingClientRect().left) / event.target.clientWidth
      var hueHex = ('0' + ((hue * 0xFF) | 0).toString(16)).slice(-2)
      window.localStorage.c = $id('pColor').value = hueHex
    })
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
      window.localStorage.n = this.value
    })
    $id('pColor').addEventListener('change', function () {
      window.localStorage.c = this.value
    })
    document.addEventListener('fullscreenchange', function () {
      resizeCanvas()
    })
    window.addEventListener('resize', function () {
      resizeCanvas()
    })

    // restore settings
    if (window.localStorage.n) $id('pName').value = window.localStorage.n
    if (window.localStorage.c) $id('pColor').value = window.localStorage.c

    setInterval(netUpdate, 1000 / 25)
  })

  function $id (x) { return document.getElementById(x) }
})()
