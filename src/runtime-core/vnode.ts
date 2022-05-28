import { ShapeFlags } from '../shared/shapeFlags'
export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export interface VNode {
  type: any
  props: any
  children: any
  key: any
  shapeFlag: any
  el: any
}

export function createVNode(type: any, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    children: children,
    key: props && props.key,
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

  // 判断是否是slots children， 他应该是组件类型，并且children是一个object
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.SLOT_CHILDREN
    }
  }

  return vnode
}

export function createTextVNode(text: string) {
  return createVNode(Text, {}, text)
}

function getShapeFlag(type: any) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}
