import { supportsLocalStorage } from './storage'

export function init (): void {
  $('.theme-switcher').click(function (event) {
    event.preventDefault()
    var theme = $(this).data('theme')
    set(theme)
    if (supportsLocalStorage()) localStorage.theme = theme
  })
  if (supportsLocalStorage()) {
    // Restore theme
    if (localStorage.theme !== undefined) set(localStorage.theme)
    // Remove save warning
    $('#theme-switcher-msg').removeClass('btn-danger').addClass('btn-info')
    $('#theme-switcher-msg-text').text('Can save')
  }
}

export function set (theme: string): void {
  $('#theme-switcher').attr('href', $('#theme-' + theme).attr('content')!)
  $('.theme-switcher').each(function () {
    $(this)[$(this).data('theme') === theme ? 'addClass' : 'removeClass']('active')
  })
}
