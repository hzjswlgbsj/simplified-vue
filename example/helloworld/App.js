import { h } from '../../lib/mini-vue.esm.js'
import { Foo } from './Foo.js'

window.self = null
export default {
  name: 'App',
  render() {
    window.self = this
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
      [h('div', {}, `hi${this.msg}`), h(Foo, { count: 1 })]
      // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini vue')]
    )
  },

  setup() {
    // compositions Api
    return {
      msg: 'hi mini-vue!',
    }
  },
}
