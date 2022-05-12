import { h } from '../../lib/mini-vue.esm'

export const App = {
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
