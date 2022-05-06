import { readonly, isReadonly } from '../reactive'

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { bar: 2 } }
    const wrapped = readonly(original)
    expect(original).not.toBe(wrapped)
    expect(wrapped.foo).toBe(1)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(original)).toBe(false)
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
