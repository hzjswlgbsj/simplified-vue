import { ref, h } from '../../lib/mini-vue.esm.js'

const nextChildren = 'newChild'
const prevChildren = 'oldChild'

export default {
  name: 'TextToText',
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
