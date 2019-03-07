/* eslint-disable @typescript-eslint/naming-convention */

declare class Simperium {
  constructor (app_id: string, options: { token: string })
  bucket (bucket_name: string): Bucket
}

interface Bucket {
  start (): void
  update (id: string, data: object): void
  on (type: 'ready', callback: () => void): void
  on (type: 'notify' | 'notify_init', callback: (id: string, data: object) => void): void
  on (type: 'local', callback: (id: string) => object | [object, string, HTMLElement]): void
  on (type: 'error', callback: (errorType: string) => object): void
}
