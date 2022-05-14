import { isObject, isOn } from '../shared'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
  // patch 派发更新
  patch(vnode, container)
}

export function patch(vnode: any, container: any) {
  const { shapeFlag } = vnode // 拿到状态flag
  // 判断vnode是不是element
  if (shapeFlag & ShapeFlags.ELEMENT) {
    // 处理element
    processElement(vnode, container)
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 处理组件
    processComponent(vnode, container)
  }
}

export function processElement(vnode: any, container: any) {
  // element类型 也分为初始化和更新
  mountElement(vnode, container)
}

export function processComponent(vnode: any, container: any) {
  // 挂载组件

  // 判断是不是element
  mountComponent(vnode, container)
}

function mountComponent(initialVNode: any, container: any) {
  // 首先创建一个组件实例
  const instance = createComponentInstance(initialVNode)

  // 然后去构建实例中必须的数据
  setupComponent(instance)

  // 递归渲染组件实例
  setupRenderEffect(instance, initialVNode, container)
}

function mountElement(vnode: any, container: any) {
  // 注意：这里的vnode是element类型
  // 创建element
  const el = (vnode.el = document.createElement(vnode.type))
  const { children, props, shapeFlag } = vnode

  // 处理children， children也分为 string和数组
  // 如果是string的话就直接是文本节点
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 如果是数组的话挂载children
    mountChildren(vnode, el)
  }

  // 处理元素的属性 props
  for (const key in props) {
    const val = props[key]

    // 处理事件注册
    if (isOn(key)) {
      const event = key.slice(2).toLocaleLowerCase()
      el.addEventListener(event, val)
    } else {
      el.setAttribute(key, val)
    }
  }

  container.appendChild(el)
}

function setupRenderEffect(instance: any, initialVNode: any, container: any) {
  const { proxy } = instance
  const subTree = instance.render.call(proxy)

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container)

  // 这里所有的element都被mount了
  initialVNode.el = subTree.el
}
function mountChildren(vnode: any, container: HTMLElement) {
  vnode.children.forEach((v: any) => {
    patch(v, container)
  })
}
