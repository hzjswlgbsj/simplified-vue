import { h } from '../../lib/mini-vue.esm.js'

export default {
  name: 'App',
  render() {
    return h('div', this.msg)
  },

  setup() {
    // compositions Api
    return {
      msg: 'hi mini-vue!',
    }
  },
}
