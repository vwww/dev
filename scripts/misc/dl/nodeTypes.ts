import { sum } from '../../util'

type NodeBrowse = NodeFile | NodeDirectory

type NodeFile = {
  type: 'file'
  name: string
  size: number
  mtime: number
  remark: string
}

type NodeDirectory = {
  type: 'dir'
  name: string
  size: number
  remark: string
  mtime: number
  children: NodeBrowse[]
}

export function d (name: string, remark: string, mtime: 0, ...children: NodeBrowse[]): NodeDirectory {
  return {
    type: 'dir',
    name,
    size: sum(children.map((child) => child.size)),
    remark,
    mtime,
    children,
  }
}

export function f (name: string, remark: string, size: number, mtime: number): NodeFile {
  return {
    type: 'file',
    name,
    size,
    remark,
    mtime,
  }
}
