import { h } from '../../lib/mini-vue.esm.js'

export default {
  name: 'App',
  render() {
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
      },
      [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini vue')]
    )
  },

  setup() {
    // compositions Api
    return {
      msg: 'hi mini-vue!',
    }
  },
}
