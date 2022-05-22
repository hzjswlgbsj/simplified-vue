// ------------------ 测试视图响应式--------------------
// 视图的更新实际上是对比更新钱的vnode和更新后的vnode
// 响应式数据改变后应该生成两个vnode
import { h, ref } from '../../lib/mini-vue.esm.js'

export default {
  name: 'App',
  setup() {
    const count = ref(0)
    const onClick = () => {
      count.value++
    }
    return {
      count,
      onClick,
    }
  },
  render() {
    return h(
      'div',
      {
        id: 'root',
      },
      [
        h('div', {}, `count: ${this.count}`), // 依赖收集
        h(
          'button',
          {
            onClick: this.onClick,
          },
          'click'
        ),
      ]
    )
  },
}
