import { ref, h } from '../../lib/mini-vue.esm.js'

const nextChildren = [h('div', {}, 'A'), h('div', {}, 'B')]
const prevChildren = 'oldChild'

export default {
  name: 'TextToArray',
  setup() {
    const isChange = ref(false)
    window.isChange = isChange // 挂载window上便于在控制台修改值

    return {
      isChange,
    }
  },
  render() {
    const self = this
    const children = self.isChange ? nextChildren : prevChildren
    return h('div', {}, children)
  },
}
