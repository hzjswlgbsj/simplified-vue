import { reactive, isReactive, isProxy } from '../reactive'

describe('reactive', () => {
  it('happy path', () => {
    const original = {
      foo: 1,
    }
    const observed = reactive(original) // original 被observed代理
    expect(observed).not.toBe(original) // observed肯定不等于original
    expect(observed.foo).toBe(1) // observed 拥有original的属性和值
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
    expect(isProxy(observed)).toBe(true)
  })

  it('nested reactive', () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
})
