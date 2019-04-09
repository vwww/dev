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

export function removeAllChildNodes (node: Node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

// Array utils
export function randomArrayItem<T> (array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function shuffle<T> (a: T[]): void {
  for (let i = a.length - 1; i; --i) {
    const j: number = Math.floor(Math.random() * (i + 1))
    const x: T = a[i]
    a[i] = a[j]
    a[j] = x
  }
}

export function sum (array: number[]): number {
  return array.reduce((a, b) => a + b, 0)
}

export function formatHexColor (v: number): string {
  return '#' + ('00000' + v.toString(16)).slice(-6)
}

// Math utils
export function clamp (a: number, b: number, c: number): number {
  return Math.max(b, Math.min(a, c))
}
