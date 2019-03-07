// DOM utils
export function $id (elementId: string): HTMLElement | null {
  return document.getElementById(elementId)
}

export function $idA<T extends HTMLElement> (elementId: string): T {
  return $id(elementId) as T
}

export function $ready (callback: () => void): void {
  document.addEventListener('DOMContentLoaded', callback)
}

export function removeAllChildNodes (node: Node): void {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

// Array utils
export function sum (array: number[]): number {
  return array.reduce((a, b) => a + b, 0)
}

export function randomArrayItem<T> (array: T[]): T {
  return array[(Math.random() * array.length) | 0]
}

export function randomArrayItemZipf<T> (array: T[]): T {
  const MAXRAND = Math.log(array.length + 1)
  const w = Math.min(Math.exp(Math.random() * MAXRAND) | 0, array.length)
  return array[w - 1]
}

export function shuffle<T> (a: T[], start = 0, end = a.length): void {
  for (let i = end - 1 - start; i !== start; --i) {
    const j: number = Math.floor(Math.random() * (i + 1))
    const x: T = a[start + i]
    a[start + i] = a[start + j]
    a[start + j] = x
  }
}

export function randomAlphaNumeric (length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let s = ''
  while (length--) {
    s += chars[(Math.random() * chars.length) | 0]
  }
  return s
}

// Hex colors
export function formatHexColor (v: number): string {
  return '#' + ('00000' + v.toString(16)).slice(-6)
}

export function randomHexColor (): string {
  return formatHexColor((Math.random() * 0xFFFFFF) | 0)
}

// Math utils
export function clamp (a: number, b: number, c: number): number {
  return Math.max(b, Math.min(a, c))
}
