import $ from 'jquery'

const KEY = 'theme'

export function init (): void {
  $('.theme-switcher').on('click', function (event) {
    event.preventDefault()
    const theme = $(this).data('theme') as string
    set(theme)
    if (window.localStorage) localStorage[KEY] = theme
  })
  if (window.localStorage) {
    // Restore theme
    if (localStorage[KEY] !== undefined) set(localStorage[KEY] as string)
    // Listen for changes from other tabs
    addEventListener('storage', (e) => e.storageArea === localStorage && e.key === KEY && set(e.newValue!))
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
