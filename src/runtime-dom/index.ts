import { createRenderer } from '../runtime-core'
import { isOn } from '../shared'

export function createElement(type: any) {
  return document.createElement(type)
}
export function patchProp(el: HTMLElement, key: string, val: any) {
  // 处理事件注册
  if (isOn(key)) {
    const event = key.slice(2).toLocaleLowerCase()
    el.addEventListener(event, val)
  } else {
    el.setAttribute(key, val)
  }
}
export function insert(el: HTMLElement, parent: any) {
  parent.appendChild(el)
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
})

export function createApp(...args: any) {
  return renderer.createApp(...args)
}

export * from '../runtime-core'
