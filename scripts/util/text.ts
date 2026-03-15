export function englishJoin (conjunction: string, a: string[]): string {
  if (a.length <= 2) return a.join(` ${conjunction} `)
  return `${a.slice(0, -1).join(', ')}, ${conjunction} ${a.at(-1)}`
}

export function firstCap (s: string): string {
  const c = Array.from(s)
  for (let i = 0; i < c.length; i++) {
    if (/\p{L}/u.test(c[i])) {
      c[i] = c[i].toUpperCase()
      return c.join('')
    }
  }
  return s
}
