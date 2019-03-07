/* global location */

document.addEventListener('DOMContentLoaded', function () {
  // Copyright year
  document.getElementById('copyyear').innerText = (new Date()).getFullYear()
  // Here!
  document.getElementById('here').innerText = location.href
  document.getElementById('form_body').value = document.getElementById('form_body').value.replace('[oxidane]', location.href)
  // Improved form
  document.getElementById('form_submit').type = 'button'
  document.getElementById('form_submit').value += '!'
  document.getElementById('form_submit').onclick = function (event) {
    location.replace(document.getElementById('form_contact').action +
      '?subject=' + encodeURIComponent(document.getElementById('form_subject').value) +
      '&body=' + encodeURIComponent(document.getElementById('form_body').value)
    )
  }
})
