import { createVNode } from './vnode'

/**
 * 在createApp 外层再包装一层使得创建一个App实例更灵活
 * @param render 外部替自己提供的render函数
 * @returns
 */
export function createAppAPI(render: any) {
  return function createApp(rootComponent: any) {
    return {
      mount(rootContainer: HTMLElement) {
        // 先转化为 VNode，然后左右操作都基于 VNode 处理
        // component -> VNode
        const vnode = createVNode(rootComponent)

        render(vnode, rootContainer)
      },
    }
  }
}
