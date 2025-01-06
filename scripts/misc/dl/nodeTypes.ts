// Client tree

export type NodeBrowse = NodeFile | NodeDirectory | NodeLink

type NodeBase<T extends string> = {
  type: T
  name: string
  size: number
  mtime: number
  remark: string
}

export interface NodeFile extends NodeBase<'f'> {}

export interface NodeDirectory extends NodeBase<'d'> {
  children: NodeBrowse[]
}

export interface NodeLink extends NodeBase<'l'> {
  href: string
}

// Server tree

type Manifest = ManifestEntry[]

type ManifestEntry = ManifestFile | ManifestLink | ManifestDirectory

type ManifestFile = ['f', name: string, remark: string, size: number, mtime: number]

type ManifestLink = ['l', name: string, remark: string, href: string]

type ManifestDirectory = ['d', name: string, remark: string, ...ManifestEntry[]]

// Server manifest to client node parser

export function parseManifest (manifest: Manifest): NodeDirectory {
  return parseManifestDirectory(['d', 'root', '', ...manifest])
}

function parseManifestFile (entry: ManifestFile): NodeFile {
  const [type, name, remark, size, mtime] = entry
  return {
    type,
    name,
    size,
    remark,
    mtime,
  }
}

function parseManifestLink (entry: ManifestLink): NodeLink {
  const [type, name, remark, href] = entry
  return {
    type,
    name,
    size: 0,
    remark,
    mtime: 0,
    href,
  }
}

function parseManifestDirectory (entry: ManifestDirectory): NodeDirectory {
  const [type, name, remark] = entry

  let size = 0
  const children = (entry.slice(3) as ManifestEntry[]).map((c) => {
    const n = parseManifestEntry(c)
    if (n.name != '1337') size += n.size
    return n
  })

  return {
    type,
    name,
    size,
    remark,
    mtime: 0,
    children,
  }
}

function parseManifestEntry (entry: ManifestEntry): NodeBrowse {
  switch (entry[0]) {
    case 'f':
      return parseManifestFile(entry)
    case 'd':
      return parseManifestDirectory(entry)
    case 'l':
      return parseManifestLink(entry)
  }
}
