export function $id (elementId: string): HTMLElement | null {
  return document.getElementById(elementId)
}

export function $idA<T extends HTMLElement> (elementId: string): T {
  return $id(elementId) as T
}

export function randomArrayItem<T> (array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function sum (array: number[]): number {
  return array.reduce((a, b) => a + b, 0)
}
