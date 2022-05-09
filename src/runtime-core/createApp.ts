import { createVNode } from './vnode'
import { render } from './render'

export function createApp(rootContainer: HTMLElement) {
  return {
    mount(rootContainer: HTMLElement) {
      // 先转化为 VNode，然后左右操作都基于 VNode 处理
      // component -> VNode
      const vnode = createVNode(rootContainer)

      render(vnode, rootContainer)
    },
  }
}
