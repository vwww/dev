// *.txt files
declare module '*.txt' {
  const content: string
  export default content
}

// process.env.NODE_ENV
declare module 'process' {
  global {
    const process: {
      env: {
        NODE_ENV: string
      }
    }
  }
}
