import { h } from '../../lib/mini-vue.esm.js'

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
      },
      this.msg
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
