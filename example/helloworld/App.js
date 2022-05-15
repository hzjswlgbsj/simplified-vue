import { h } from '../../lib/mini-vue.esm.js'
import { Foo } from './Foo.js'

export default {
  name: 'App',
  render() {
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
        onClick() {
          console.log('click')
        },
        onMousedown() {
          console.log('onMousedown')
        },
      },
      [
        h('div', {}, 'App'),
        h(Foo, {
          // on + Event
          onAdd(a, b) {
            console.log('onAdd', a, b)
          },
          onAddFoo() {
            console.log('onAddFoo')
          },
        }),
      ]
    )
  },

  setup() {
    // compositions Api
    return {
      msg: 'hi mini-vue!',
    }
  },
}
