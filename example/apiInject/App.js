import { h, provide, inject } from '../../lib/mini-vue.esm.js'
import { Foo } from './Foo.js'

const Provider = {
  name: 'Provider',
  setup() {
    provide('foo', 'fooval')
    provide('bar', 'barval')
  },
  render() {
    return h('div', {}, [h('p', {}, 'Provider'), h(Consumer)])
  },
}

const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo')
    const bar = inject('bar')

    return {
      foo,
      bar,
    }
  },
  render() {
    return h('div', {}, `Consumer - ${this.foo} - ${this.bar}`)
  },
}

export default {
  name: 'App',
  render() {
    return h('div', {}, [Provider])
  },

  setup() {
    // compositions Api
    return {
      msg: 'hi mini-vue!',
    }
  },
}
