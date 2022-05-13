import { createVNode } from './vnode'
import { render } from './renderer'

export function createApp(rootComponent: any) {
  return {
    mount(rootContainer: HTMLElement) {
      // 先转化为 VNode，然后左右操作都基于 VNode 处理
      // component -> VNode
      const vnode = createVNode(rootComponent)

      render(vnode, rootContainer)
    },
  }
}
