import { VNode } from './vnode'

/**
 * 对比两个虚拟节点的props对象，返回是否需要触发更新
 * @param n1 旧的组件节点
 * @param n2 新的组件节点
 */
export function shouldUpdateComponent(
  prevVNode: VNode,
  nextVNode: VNode
): boolean {
  const { props: prevProps } = prevVNode
  const { props: nextProps } = nextVNode

  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }

  return false
}
