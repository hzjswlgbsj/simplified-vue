import { ShapeFlags } from '../shared/shapeFlags'

export function createVNode(type: any, props?: any, children?: any[]) {
  const vnode = {
    type,
    props,
    children: children,
    shapeFlag: getShapeFlag(type),
    el: null,
  }

  // children
  if (typeof children === 'string') {
    // 合并vnode节点类型和children类型，相当于同时判断了节点类型也判断了children类型
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
  }

  return vnode
}

function getShapeFlag(type: any) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}
