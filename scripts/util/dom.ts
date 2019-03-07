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
