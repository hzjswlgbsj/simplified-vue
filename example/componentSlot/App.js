import { h, createTextVNode } from '../../lib/mini-vue.esm.js'
import { Foo } from './Foo.js'

export default {
  name: 'App',
  render() {
    const app = h('div', {}, 'app')
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => [
          h('p', {}, 'heager' + age),
          createTextVNode('你好啊'),
        ],
        footer: ({ age }) => h('p', {}, 'footer' + age),
      }
    )
    return h('div', {}, [app, foo])
  },

  setup() {
    return {}
  },
}
