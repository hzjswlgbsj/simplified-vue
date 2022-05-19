import { h } from '../../lib/mini-vue.esm.js'

export default {
  name: 'App',
  render() {
    return h('rect', {
      x: this.x,
      x: this.y,
    })
  },

  setup() {
    return {
      x: 100,
      y: 100,
    }
  },
}
