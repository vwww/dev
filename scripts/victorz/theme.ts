import $ from 'jquery'

import { supportsLocalStorage } from './storage'

export function init (): void {
  $('.theme-switcher').click(function (event) {
    event.preventDefault()
    const theme = $(this).data('theme') as string
    set(theme)
    if (supportsLocalStorage()) localStorage.theme = theme
  })
  if (supportsLocalStorage()) {
    // Restore theme
    if (localStorage.theme !== undefined) set(localStorage.theme as string)
    // Remove save warning
    $('#theme-switcher-msg').removeClass('btn-danger').addClass('btn-info')
    $('#theme-switcher-msg-text').text('Can save')
    $('.theme-switcher-msg').remove()
  }
}

export function set (theme: string): void {
  $('#theme-switcher').attr('href', $('#theme-' + theme).attr('content')!)
  $('.theme-switcher').each(function () {
    $(this)[$(this).data('theme') === theme ? 'addClass' : 'removeClass']('active')
  })
}
