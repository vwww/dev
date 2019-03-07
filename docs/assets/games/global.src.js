/* global alert, XMLHttpRequest, ActiveXObject */

// global functions
function $ (id) { return document.getElementById(id) }
function $remove (elem) { if (elem) return elem.parentNode.removeChild(elem) }
// core functions
var core = {
  root: null,
  cdn: null,
  // AJAX for all browsers
  GetXmlHttpObject: function () {
    var xmlHttp = null
    try {
      // Firefox, Opera 8.0+, Safari
      xmlHttp = new XMLHttpRequest()
    } catch (e) {
      // Internet Explorer
      try {
        xmlHttp = new ActiveXObject('Msxml2.XMLHTTP')
      } catch (e) {
        xmlHttp = new ActiveXObject('Microsoft.XMLHTTP')
      }
    }
    return xmlHttp
  },
  // AJAX POST FUNCTION
  AjaxPost: function (url, param, successFunction) {
    var xmlHttp = this.GetXmlHttpObject()
    if (xmlHttp == null) {
      if (!this.ajaxNotified) alert("Your browser doesn't support AJAX. You should really upgrade it!")
      this.ajaxNotified = true
      return
    }
    if (successFunction) {
      xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
          successFunction(xmlHttp.responseText)
        }
      }
    }
    xmlHttp.open('POST', url, true)
    xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xmlHttp.send(param)
  },
  // Handle multiple checkboxes
  checkAll: function (name, check) {
    var elements = document.getElementsByName(name)
    for (var i in elements)
      elements[i].checked = check
  },
  // SHA1-signed login requests
  login: {
    timestamp_offset: 0,
    prepare: function (timestamp) {
      $('btnLogin').disabled = false
      $('btnLogin').value = 'Login!'
      this.timestamp_offset = timestamp - Math.round(new Date().getTime() / 1000)
    },
    send: function () {
      // SHA1 function
      function sha1 (str) {
        // http://kevin.vanzonneveld.net
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // + namespaced by: Michael White (http://getsprink.com)
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // -    depends on: utf8_encode
        // *     example 1: sha1('Kevin van Zonneveld')
        // *     returns 1: '54916d2e62f65b3afa6e192e6a601cdbe5cb5897'
        var rotate_left = function (n, s) {
          var t4 = (n << s) | (n >>> (32 - s))
          return t4
        }

        /*var lsb_hex = function (val) { // Not in use--is it needed?
        	var str=""
        	var i
        	var vh
        	var vl

        	for ( i=0; i<=6; i+=2 ) {
        	  vh = (val>>>(i*4+4))&0x0f
        	  vl = (val>>>(i*4))&0x0f
        	  str += vh.toString(16) + vl.toString(16)
        	}
        	return str
          };*/

        var cvt_hex = function (val) {
          var str = ''
          var i
          var v

          for (i = 7; i >= 0; i--) {
            v = (val >>> (i * 4)) & 0x0f
            str += v.toString(16)
          }
          return str
        }

        var blockstart
        var i, j
        var W = new Array(80)
        var H0 = 0x67452301
        var H1 = 0xEFCDAB89
        var H2 = 0x98BADCFE
        var H3 = 0x10325476
        var H4 = 0xC3D2E1F0
        var A, B, C, D, E
        var temp

        function utf8_encode (argString) {
          // http://kevin.vanzonneveld.net
          // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
          // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
          // +   improved by: sowberry
          // +    tweaked by: Jack
          // +   bugfixed by: Onno Marsman
          // +   improved by: Yves Sucaet
          // +   bugfixed by: Onno Marsman
          // +   bugfixed by: Ulrich
          // +   bugfixed by: Rafal Kukawski
          // +   improved by: kirilloid
          // +   bugfixed by: kirilloid
          // *     example 1: utf8_encode('Kevin van Zonneveld')
          // *     returns 1: 'Kevin van Zonneveld'

          if (argString === null || typeof argString === 'undefined') {
            return ''
          }

          var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
          var utftext = '',
            start, end, stringl = 0

          start = end = 0
          stringl = string.length
          for (var n = 0; n < stringl; n++) {
            var c1 = string.charCodeAt(n)
            var enc = null

            if (c1 < 128) {
              end++
            } else if (c1 > 127 && c1 < 2048) {
              enc = String.fromCharCode(
                (c1 >> 6) | 192,
                (c1 & 63) | 128
              )
            } else if (c1 & 0xF800 != 0xD800) {
              enc = String.fromCharCode(
                (c1 >> 12) | 224,
                ((c1 >> 6) & 63) | 128,
                (c1 & 63) | 128
              )
            } else { // surrogate pairs
              if (c1 & 0xFC00 != 0xD800) { throw new RangeError('Unmatched trail surrogate at ' + n); }
              var c2 = string.charCodeAt(++n)
              if (c2 & 0xFC00 != 0xDC00) { throw new RangeError('Unmatched lead surrogate at ' + (n - 1)); }
              c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000
              enc = String.fromCharCode(
                (c1 >> 18) | 240,
                ((c1 >> 12) & 63) | 128,
                ((c1 >> 6) & 63) | 128,
                (c1 & 63) | 128
              )
            }
            if (enc !== null) {
              if (end > start) {
                utftext += string.slice(start, end)
              }
              utftext += enc
              start = end = n + 1
            }
          }

          if (end > start) {
            utftext += string.slice(start, stringl)
          }

          return utftext
        }
        str = utf8_encode(str)
        var str_len = str.length

        var word_array = []
        for (i = 0; i < str_len - 3; i += 4) {
          j = str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 | str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3)
          word_array.push(j)
        }

        switch (str_len % 4) {
          case 0:
            i = 0x080000000
            break
          case 1:
            i = str.charCodeAt(str_len - 1) << 24 | 0x0800000
            break
          case 2:
            i = str.charCodeAt(str_len - 2) << 24 | str.charCodeAt(str_len - 1) << 16 | 0x08000
            break
          case 3:
            i = str.charCodeAt(str_len - 3) << 24 | str.charCodeAt(str_len - 2) << 16 | str.charCodeAt(str_len - 1) << 8 | 0x80
            break
        }

        word_array.push(i)

        while ((word_array.length % 16) != 14) {
          word_array.push(0)
        }

        word_array.push(str_len >>> 29)
        word_array.push((str_len << 3) & 0x0ffffffff)

        for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
          for (i = 0; i < 16; i++) {
            W[i] = word_array[blockstart + i]
          }
          for (i = 16; i <= 79; i++) {
            W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1)
          }

          A = H0
          B = H1
          C = H2
          D = H3
          E = H4

          for (i = 0; i <= 19; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff
            E = D
            D = C
            C = rotate_left(B, 30)
            B = A
            A = temp
          }

          for (i = 20; i <= 39; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff
            E = D
            D = C
            C = rotate_left(B, 30)
            B = A
            A = temp
          }

          for (i = 40; i <= 59; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff
            E = D
            D = C
            C = rotate_left(B, 30)
            B = A
            A = temp
          }

          for (i = 60; i <= 79; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff
            E = D
            D = C
            C = rotate_left(B, 30)
            B = A
            A = temp
          }

          H0 = (H0 + A) & 0x0ffffffff
          H1 = (H1 + B) & 0x0ffffffff
          H2 = (H2 + C) & 0x0ffffffff
          H3 = (H3 + D) & 0x0ffffffff
          H4 = (H4 + E) & 0x0ffffffff
        }

        temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4)
        return temp.toLowerCase()
      }
      $('auth_timestamp').value = this.timestamp_offset + Math.round(new Date().getTime() / 1000)
      // $('auth_randomassist') = 
      $('auth_randomself').value = Math.floor(Math.random() * 9007199254740992)
      // hash(>hash([password])@[timestamp]:[random_server]![random_client]<)
      $('auth_final').value = sha1('>' + sha1($('password').value) + '@' + $('auth_timestamp').value + ':' + $('auth_randomassist').value + '!' + $('auth_randomself').value + '<')
      $('password').value = ''
      $('btnLogin').disabled = true
      $('loginform').submit() // since we forced it to return false on its normal submission
    }
  }
}
// public async functions
var pub = {
  // shortcut function
  _: function (task, params, success) {
    core.AjaxPost(core.root + 'async_public.php', 'task=' + task + '&' + params, success)
  },
  // regenerate captcha
  newCaptcha: function (caller) {
    caller.src = caller.src.replace(/&time=\d*$/, '&time=' + new Date().getTime())
  },
  // get comments
  commentCallback: function (data) {
    if (data[0] == '!') alert(data.slice(1))
    else {
      data_sep = data.indexOf('|')
      $('total_comments').innerText = data.slice(0, data_sep)
      $('comments').innerHTML = data.slice(data_sep + 1)
    }
  },
  getComments: function (gid, page) {
    this._('comments', 'id=' + gid + '&page=' + page, this.commentCallback)
  },
  // registration validaton
  checkRegisterUsername: function () {
    this._('register_username', 'user=' + encodeURIComponent($('username').value), function (data) {
      if (data[0] == '!') {
        $('ival_username').innerText = data.slice(1)
        $('ival_username').className = 'ival_fail'
      }else {
        if ($('username').value != data)
          $('ival_username').innerText = 'Fixed: ' + data
        $('ival_username').className = 'ival_pass'
      }
    })
    $('ival_username').innerText = ''
    $('ival_username').className = 'ival_progress'
  },
  checkRegiserPasswords: function () {
    // Is there a password?
    if ($('password').value) {
      $('ival_password').innerText = ''
      $('ival_password').className = 'ival_pass'
    }else {
      $('ival_password').innerText = 'Enter a password.'
      $('ival_password').className = 'ival_fail'
    }
    // Matching passwords?
    if (!$('password2').value) {
      $('ival_password2').innerText = 'Enter a password.'
      $('ival_password2').className = 'ival_fail'
    }
    else if ($('password').value == $('password2').value) {
      $('ival_password2').innerText = ''
      $('ival_password2').className = 'ival_pass'
    }else {
      $('ival_password2').innerText = 'The passwords differ.'
      $('ival_password2').className = 'ival_fail'
    }
  },
  checkRegisterEmail: function () {
    this._('register_email', 'email=' + encodeURIComponent($('email').value), function (data) {
      if (data[0] == '!') {
        $('ival_email').innerText = data.slice(1)
        $('ival_email').className = 'ival_fail'
      }else {
        $('ival_email').innerText = ''
        $('ival_email').className = 'ival_pass'
      }
    })
    $('ival_email').innerText = ''
    $('ival_email').className = 'ival_progress'
  }
}
// user async functions
var user = {
  // shortcut function
  _: function (task, params, success) {
    core.AjaxPost(core.root + 'async_user.php', 'task=' + task + '&' + params, success)
  },
  // toggle favorite
  togglefav: function (caller, id) {
    if (caller.src.search('0.') > -1) {
      // favorite
      this._('fav', 'id=' + id, function () {
        caller.src = caller.src.replace('progress.gif', 'fav_1.png')
      // too lazy to add to their favorites list...
      })
    }
    else if (caller.src.search('1.') > -1) {
      // unfavorite
      this._('unfav', 'id=' + id, function () {
        caller.src = caller.src.replace('progress.gif', 'fav_0.png')
        $remove($('fav_' + id))
      })
    }
    caller.src = caller.src.replace(/fav_[01]\.png/, 'progress.gif')
    return false
  },
  // rate a game
  rate_locked: false,
  rate: function (gid, up) {
    if (this.rate_locked) return false
    var self = this
    this._('rate', 'id=' + gid + (up ? '&up=1' : ''), function (data) {
      data = data.split('|')
      $('vote-up').src = $('vote-up').src.replace('progress.gif', 'vote_up_' + ((data[0] > 0) ? 1 : 0) + '.png')
      $('vote-down').src = $('vote-down').src.replace('progress.gif', 'vote_down_' + ((data[0] < 0) ? 1 : 0) + '.png')
      $('vote-up-num').innerText = data[1]
      $('vote-down-num').innerText = data[2]
      $('vote-val').innerText = (data[1] - data[2] < 0) ? (data[1] - data[2]) : '+' + (data[1] - data[2])
      self.rate_locked = false
    })
    $('vote-up').src = $('vote-up').src.replace(/vote_up_[01]\.png/, 'progress.gif')
    $('vote-down').src = $('vote-down').src.replace(/vote_down_[01]\.png/, 'progress.gif')
    this.rate_locked = true
    return false
  },
  // friendship
  toggleFriends: function (uid, caller, inverted) {
    if (caller.src.search('progress.gif') > -1) return false
    this._('friend', 'id=' + uid, function (friended) {
      friended = (friended != '0')
      if (inverted)
        caller.src = caller.src.replace('progress.gif', 'remove_' + (friended ? 0 : 1) + '.png')
      else
        caller.src = caller.src.replace('progress.gif', 'add_' + (friended ? 1 : 0) + '.png')
    })
    if (inverted) caller.src = caller.src.replace(/remove_[01]\.png/, 'progress.gif')
    else caller.src = caller.src.replace(/add_[01]\.png/, 'progress.gif')
    return false
  },
  // commenting
  postComment: function (gid) {
    this._('add_comment', 'id=' + gid + '&content=' + encodeURIComponent($('the_comment').value), function (data) {
      pub.commentCallback(data)
      if (data[0] != '!')
        $('the_comment').value = ''
    })
    return false
  },
  deleteComment: function (cid) {
    this._('delete_comment', 'id=' + cid, pub.commentCallback)
    return false
  }
}
// Resize the game!
var resizer = {
  expanded: false,
  origWidth: undefined,
  origHeight: undefined,
  fadeInCallback: function (callback, opacity) {
    opacity += 0.08
    if (opacity < 0.50) {
      $('overlay').style.opacity = opacity
      window.setTimeout(function () { callback(callback, opacity); }, 10)
    }
    else $('overlay').style.opacity = 0.50
  },
  overlayIn: function () {
    this.fadeInCallback(this.fadeInCallback, 0)
  },
  getWidth: function () {
    if (self.innerWidth)
      return self.innerWidth
    else if (document.documentElement && document.documentElement.clientWidth)
      return document.documentElement.clientWidth
    else if (document.body)
      return document.body.clientWidth
    return 0
  },
  getHeight: function () {
    if (self.innerHeight)
      return self.innerHeight
    else if (document.documentElement && document.documentElement.clientHeight)
      return document.documentElement.clientHeight
    else if (document.body)
      return document.body.clientHeight
    return 0
  },
  expand: function (oldWidth, oldHeight) {
    var $targ = $('resizer_target')
    if ($targ == null) return false
    this.origWidth = oldWidth
    this.origHeight = oldHeight
    var dW = this.getWidth()
    var dH = this.getHeight()
    var wHeight
    var wWidth
    if (dW * oldHeight >= dH * oldWidth) // if((dW / dH) >= (oldWidth / oldHeight))
      wWidth = (wHeight = dH) * oldWidth / oldHeight
    else wHeight = (wWidth = dW) * oldHeight / oldWidth
    $targ.setAttribute('width', wWidth)
    $targ.setAttribute('height', wHeight)

    $('game_container').className = 'flash_popup'
    $('game_container').style.marginLeft = '-' + (wWidth / 2) + 'px'
    $('game_container').style.marginTop = '-' + (wHeight / 2) + 'px'

    $('overlay').style.display = 'inline'
    // $('overlay').onclick = this.unexpand
    this.overlayIn()

    $('close_fs').style.display = 'inline'
    this.expanded = true
    return false
  },
  unexpand: function () {
    var $targ = $('resizer_target')
    if ($targ == null || !this.expanded) return
    $targ.setAttribute('width', this.origWidth)
    $targ.setAttribute('height', this.origHeight)

    $('game_container').className = 'flash_nopopup'
    $('game_container').style.marginLeft = '0px'
    $('game_container').style.marginTop = '0px'

    $('overlay').style.display = 'none'
    $('close_fs').style.display = 'none'

    this.expanded = false
  },
  // called by window.onresize
  resized: function () {
    if (window.resizer.expanded) {
      window.resizer.expand.call(window.resizer, window.resizer.origWidth, window.resizer.origHeight)
    }
  }
}
window.onresize = resizer.resized
