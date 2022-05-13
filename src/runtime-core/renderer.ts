import { isObject } from '../shared'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
  // patch 派发更新
  patch(vnode, container)
}

export function patch(vnode: any, container: any) {
  // TODO 判断VNode是不是element
  // 思考：如何区分是element还是component
  if (typeof vnode.type === 'string') {
    // 处理element
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
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

function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode)

  // setupComponent
  setupComponent(instance)

  setupRenderEffect(instance, container)
}

function mountElement(vnode: any, container: any) {
  // 创建element
  const el = document.createElement(vnode.type)
  const { children, props } = vnode

  // 处理children， children也分为 string和数组
  // 如果是string的话就直接是文本节点
  if (typeof vnode.children === 'string') {
    el.textContent = children
  } else if (Array.isArray(vnode.children)) {
    mountChildren(vnode, el)
  }

  // 处理元素的属性 props
  for (const key in props) {
    const val = props[key]
    el.setAttribute(key, val)
  }
  container.appendChild(el)
}

function setupRenderEffect(instance: any, container: any) {
  const subTree = instance.render()

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container)
}
function mountChildren(vnode: any, container: HTMLElement) {
  vnode.children.forEach((v: any) => {
    patch(v, container)
  })
}
