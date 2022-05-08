import { readonly, isReadonly, isProxy } from '../reactive'

describe('readonly', () => {
  it('should make nested values readonly', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)
    expect(original).not.toBe(wrapped)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(original)).toBe(false)
    expect(isReadonly(wrapped.bar)).toBe(true)
    expect(isReadonly(original.bar)).toBe(false)
    expect(isProxy(wrapped)).toBe(true)
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
