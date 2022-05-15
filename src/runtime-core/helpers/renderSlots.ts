import { createVNode, Fragment } from '../vnode'

export function renderSlots(slots: any, name: string, props: any) {
  const slot = slots[name]
  if (slot) {
    if (typeof slot === 'function') {
      // children 中是不可以有 array的，所以这里用一个div包裹
      // 如何解决？其实我们只需要把children里面的所有节点渲染出来就行
      return createVNode(Fragment, {}, slot(props))
    }
  }
}
