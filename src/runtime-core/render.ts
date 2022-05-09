import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
  // patch 派发更新
  patch(vnode, container)
}

export function patch(vnode: any, container: any) {
  // 处理组件
  processComponent(vnode, container)
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

function setupRenderEffect(instance: any, container: any) {
  const subTree = instance.render()

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container)
}
