import { readonly, isReadonly } from '../reactive'

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)
    expect(original).not.toBe(wrapped)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(original)).toBe(false)
    expect(isReadonly(wrapped.bar)).toBe(true)
    expect(isReadonly(original.bar)).toBe(false)
    expect(wrapped.foo).toBe(1)
  })

  it('warn then call set', () => {
    // console.warn
    console.warn = jest.fn() // mock
    const user = readonly({
      name: 'sixty',
    })

    user.name = 'sixzero'
    expect(console.warn).toBeCalled()
  })
})
