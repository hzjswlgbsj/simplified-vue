import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { Fragment, Text } from './vnode'

export function createRenderer(options: any) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options
  function render(vnode: any, container: any) {
    // patch 派发更新
    patch(vnode, container, null)
  }

  function patch(vnode: any, container: any, parentComponent: any) {
    const { shapeFlag, type } = vnode // 拿到状态flag

    // Fragment -> 只渲染 children ，不增加一个div包裹
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent)
        break
      case Text:
        processText(vnode, container)
        break
      default:
        // 判断vnode是不是element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理element
          processElement(vnode, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(vnode, container, parentComponent)
        }
        break
    }
  }

  function processText(vnode: any, container: any) {
    // Text 类型
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    container.appendChild(textNode)
  }

  function processFragment(vnode: any, container: any, parentComponent: any) {
    // fragment 类型
    mountChildren(vnode, container, parentComponent)
  }

  function processElement(vnode: any, container: any, parentComponent: any) {
    // element类型 也分为初始化和更新
    mountElement(vnode, container, parentComponent)
  }

  function processComponent(vnode: any, container: any, parentComponent: any) {
    // 挂载组件
    mountComponent(vnode, container, parentComponent)
  }

  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent: any
  ) {
    // 首先创建一个组件实例
    const instance = createComponentInstance(initialVNode, parentComponent)

    // 然后去构建实例中必须的数据
    setupComponent(instance)

    // 递归渲染组件实例
    setupRenderEffect(instance, initialVNode, container)
  }

  function mountElement(vnode: any, container: any, parentComponent: any) {
    // 注意：这里的vnode是element类型
    const el = (vnode.el = hostCreateElement(vnode.type))
    const { children, props, shapeFlag } = vnode

    // 处理children， children也分为 string和数组
    // 如果是string的话就直接是文本节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果是数组的话挂载children
      mountChildren(vnode, el, parentComponent)
    }

    // 处理元素的属性 props
    for (const key in props) {
      const val = props[key]
      hostPatchProp(el, key, val)
    }

    hostInsert(el, container)
  }

  function setupRenderEffect(instance: any, initialVNode: any, container: any) {
    const { proxy } = instance
    const subTree = instance.render.call(proxy)

    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container, instance)

    // 这里所有的element都被mount了
    initialVNode.el = subTree.el
  }

  function mountChildren(
    vnode: any,
    container: HTMLElement,
    parentComponent: any
  ) {
    vnode.children.forEach((v: any) => {
      patch(v, container, parentComponent)
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}
