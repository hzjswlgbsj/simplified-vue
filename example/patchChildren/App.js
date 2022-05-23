// ------------------ 测试视图更新的children更新部分--------------------
// 这里我们需要对比新老节点的情况，一共有4中情况
// case1： 老的节点是 array 新的节点是 text
// case2： 老的节点是 text 新的节点是 text
// case3： 老的节点是 text 新的节点是 array
// case4： 老的节点是 array 新的节点是 array
import { h } from '../../lib/mini-vue.esm.js'
import ArrayToText from './ArrayToText.js'
import TextToText from './TextToText.js'
import TextToArray from './TextToArray.js'

export default {
  name: 'App',
  setup() {},
  render() {
    return h(
      'div',
      {
        tid: 1,
      },
      [
        h('p', {}, '主页'),
        // case1： 老的节点是 array 新的节点是 text
        // h(ArrayToText),
        // case2： 老的节点是 text 新的节点是 text
        // h(TextToText),
        // case3： 老的节点是 text 新的节点是 array
        h(TextToArray),
        // case4： 老的节点是 array 新的节点是 array
        // h(ArrayToArray),
      ]
    )
  },
}
