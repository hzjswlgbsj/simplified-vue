import { effect } from '../effect'
import { ref, isRef, unRef, proxyRefs } from '../ref'

describe('ref', () => {
  it('should hold a value', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
    a.value = 2
    expect(a.value).toBe(2)
  })

  it('should be reactive', () => {
    const a = ref(1)
    let dummy
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // same value should not trigger
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  })

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1,
    })
    let dummy
    effect(() => {
      dummy = a.value.count
    })
    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)
  })

  test('isRef', () => {
    expect(isRef(ref(1))).toBe(true)
    // expect(isRef(computed(() => 1))).toBe(true)

    expect(isRef(0)).toBe(false)
    expect(isRef(1)).toBe(false)
    // an object that looks like a ref isn't necessarily a ref
    expect(isRef({ value: 0 })).toBe(false)
  })

  test('unref', () => {
    expect(unRef(1)).toBe(1)
    expect(unRef(ref(1))).toBe(1)
  })

  // it.skip('should work without initial value', () => {
  //   const a = ref()
  //   let dummy
  //   effect(() => {
  //     dummy = a.value
  //   })
  //   expect(dummy).toBe(undefined)
  //   a.value = 2
  //   expect(dummy).toBe(2)
  // })

  // it('proxyRefs', () => {
  //   const user = {
  //     age: ref(10),
  //     name: 'sixty',
  //   }

  //   const proxyUser = proxyRefs(user)
  //   expect(user.age.value).toBe(10)
  //   expect(proxyUser.age).toBe(10)
  //   expect(proxyUser.name).toBe('sixty')

  //   proxyUser.age = 20
  //   expect(proxyUser.age).toBe(20)
  //   expect(user.age.value).toBe(20)

  //   proxyUser.age = ref(10)
  //   expect(proxyUser.age).toBe(10)
  //   expect(user.age.value).toBe(10)
  // })

  // it.skip('should work like a normal property when nested in a reactive object', () => {
  //   const a = ref(1)
  //   const obj = reactive({
  //     a,
  //     b: {
  //       c: a,
  //     },
  //   })

  //   let dummy1: number
  //   let dummy2: number

  //   effect(() => {
  //     dummy1 = obj.a
  //     dummy2 = obj.b.c
  //   })

  //   const assertDummiesEqualTo = (val: number) =>
  //     [dummy1, dummy2].forEach((dummy) => expect(dummy).toBe(val))

  //   assertDummiesEqualTo(1)
  //   a.value++
  //   assertDummiesEqualTo(2)
  //   obj.a++
  //   assertDummiesEqualTo(3)
  //   obj.b.c++
  //   assertDummiesEqualTo(4)
  // })

  // it.skip('should unwrap nested ref in types', () => {
  //   const a = ref(0)
  //   const b = ref(a)

  //   expect(typeof (b.value + 1)).toBe('number')
  // })

  // it.skip('should unwrap nested values in types', () => {
  //   const a = {
  //     b: ref(0),
  //   }

  //   const c = ref(a)

  //   expect(typeof (c.value.b + 1)).toBe('number')
  // })
})
