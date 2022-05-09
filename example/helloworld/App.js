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
