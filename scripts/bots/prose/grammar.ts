import { randomArrayItem } from '@/util'

export class Grammar {
  productions = new Map<string, ProductionRule[]>()
  productionOrder: string[] = []

  static fromStr (str: string): Grammar {
    return parse(scan(str))
  }
}

type GrammarSymbol = [terminal: boolean, value: string]
type ProductionRule = GrammarSymbol[]

export class TokenStream {
  stack: GrammarSymbol[]

  constructor (public g: Grammar, startSymbol: string, public maxStackSize: number) {
    this.stack = [[false, startSymbol]]
  }

  next (): string {
    let iterLimit = 1 << 16
    while (this.stack.length) {
      const [terminal, value] = this.stack.pop()!

      if (!terminal) {
        const p = this.g.productions.get(value)
        if (p?.length) {
          // Add non-terminals to stack
          const rule = randomArrayItem(p)
          for (let i = rule.length - 1; i >= 0; i--) {
            if (this.stack.length >= this.maxStackSize) {
              throw new Error('stack overflow')
            }
            this.stack.push(rule[i])
          }

          if (!--iterLimit) {
            throw new Error('iterarion limit reached')
          }
          continue
        }
        // If rule does not exist, treat symbol as terminal
      }

      // Return terminal
      return value
    }

    // Stack is empty (end of string)
    return ''
  }

  produce (stopAfter: number): string {
    const s = []
    let nextToken
    while (nextToken = this.next()) {
      s.push(nextToken)
      if ((stopAfter -= nextToken.length) <= 0) {
        break
      }
    }
    return s.join('')
  }
}

// #region Scanner
type Token =
  | TokenOp
  | TokenID
  | TokenStr
  | TokenEOF
type TokenOp = ['op', op: string]
type TokenID = ['id', id: string]
type TokenStr = ['str', str: string]
type TokenEOF = ['$']

type TokenPos = [Token, line: number, col: number]

function* scan (str: string): Generator<TokenPos, void, unknown> {
  const iter = str[Symbol.iterator]()

  let c
  let line = 1
  let col = 0

  function next (): string | undefined {
    const { value, done } = iter.next()
    if (done) {
      return c = undefined
    }

    if (value === '\n') {
      line++
      col = 0
    } else {
      col++
    }

    return c = value
  }

  next()
  if (c === '\uFEFF') {
    // ignore BOM
    next()
  }

  function error (err: string): never {
    throw new Error(`<input>:${line}:${col}: ${err}`)
  }

  const tp: TokenPos = [['$'], line, col]
  for (;;) {
    // skip white space
    while (c === ' ' || c === '\r' || c === '\n' || c === '\t') {
      next()
    }

    if (!c) {
      yield [['$'], line, col]
      return
    }

    tp[1] = line
    tp[2] = col

    if (/[a-zA-Z_]/.test(c)) {
      // scan Identifier
      const tokenText: string[] = []
      do {
        tokenText.push(c)
        next()
      } while (c && /\w/.test(c))

      tp[0] = ['id', tokenText.join('')]
      yield tp
    } else {
      switch (c) {
        case '"':
          // scan String
          const tokenText: string[] = []
          while (next() !== '"') {
            if (c === '\n' || !c) {
              error('literal not terminated')
            }
            if (c === '\\') {
              next()
              if (c !== '\\' && c !== '"') {
                error('invalid char escape')
              }
            }
            tokenText.push(c)
          }
          next()

          tp[0] = ['str', tokenText.join('')]
          yield tp
          break

        case '/':
          // scan Comment
          next()
          if (c === '/') {
            // line comment
            do {
              next()
            } while (c && c !== '\n')

            break
          } else if (c === '*') {
            // block comment
            next()
            for (;;) {
              if (!c) {
                error('comment not terminated')
              }
              const c0 = c
              next()
              if (c0 === '*' && c === '/') {
                next()
                break
              }
            }
            break
          }
          // fallthrough

        default:
          yield [['op', c], line, col]
          next()
      }
    }
  }
}
// #endregion

// #region Parser
export function parse (tokens: Iterable<TokenPos>): Grammar {
  const g = new Grammar()

  let lhs: string
  let rule: ProductionRule | undefined

  let token: Token | undefined

  for (const [nextToken, line, col] of tokens) {
    const [nextTokenType] = nextToken

    function unexpected (expected: string): never {
      throw new Error(`expected ${expected}, got ${nextTokenText} at ${line}:${col}`)
    }

    let nextTokenText: string
    switch (nextTokenType) {
      case 'op':
        if (nextToken[1] !== '|' && nextToken[1] !== '=') {
          nextTokenText = `unknown op ${nextToken[1]}`
          unexpected('valid token')
        }
        // fallthrough
      case 'id':
      case 'str':
        nextTokenText = `${nextTokenType} ${nextToken[1]}`
        break
      case '$':
        nextTokenText = '<EOF>'
        break
      default:
        nextTokenText = nextTokenType
        unexpected('valid token')
    }

    function addRule (): void {
      if (!g.productions.has(lhs)) {
        g.productions.set(lhs, [])
      }
      g.productions.get(lhs)!.push(rule = [])
    }

    function appendRHS (): void {
      rule!.push([token![0] === 'str', token![1]!])

      if (nextTokenType === 'op' && nextToken[1] === '|') {
        addRule()
      }
    }

    switch (token?.[0]) {
      default:
        if (nextTokenType !== 'id') {
          unexpected('id')
        }
        break

      case 'op':
        if (token[1] === '|') {
          if (nextTokenType !== 'id' && nextTokenType !== 'str') {
            unexpected('id or string')
          }
        } else { // =
          if (nextTokenType !== 'id'
            && nextTokenType !== 'str'
            && (nextTokenType !== 'op' || nextToken[1] !== '|')) {
              unexpected('id or string or |')
          }
        }
        break

      case 'id':
        if (nextToken[0] === 'op' && nextToken[1] === '=') {
          if (rule && !rule.length) {
            unexpected('id or string or | or <EOF>')
          }

          lhs = token[1]
          if (!g.productions.has(lhs)) {
            g.productionOrder.push(lhs)
          }

          addRule()
        } else {
          if (!rule) {
            unexpected('=')
          }

          appendRHS()
        }
        break

      case 'str':
        if (nextToken[0] === 'op' && nextToken[1] === '=') {
          unexpected('id or string or | or <EOF>')
        }

        appendRHS()
    }

    if (nextTokenType === '$') {
      for (const [lhs, rules] of g.productions) {
        rules.forEach((rule, i) => {
          rule.forEach((rhs, j) => {
            const [terminal, value] = rhs
            if (!terminal && !g.productions.has(value)) {
              throw new Error(`rule '${lhs}' production ${i} item ${j} references undefined rule '${value}'`)
            }
          })
        })
      }

      return g
    }

    token = nextToken
  }

  throw new Error('unexpected end of tokens')
}
// #endregion
