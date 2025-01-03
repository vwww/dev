// standard js requires a semicolon at the front, which looks strange...
;(function () {
  var css = document.createElement('style')
  css.type = 'text/css'
  css.innerHTML = 'img.detect_ID10T{display:none}'
  document.body.appendChild(css)
})()
