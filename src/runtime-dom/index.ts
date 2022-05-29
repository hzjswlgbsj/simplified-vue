//---------------------------DOM API-----------------------------
// 对 DOM API的一些封装实现 以提供给render -> patch 流程做视图初始化和更新

import { createRenderer } from '../runtime-core'
import { isOn } from '../shared'

export function createElement(type: any) {
  return document.createElement(type)
}

export function patchProp(
  el: HTMLElement,
  key: string,
  prevVal: any,
  nextVal: any
) {
  // 处理事件注册
  if (isOn(key)) {
    const event = key.slice(2).toLocaleLowerCase()
    el.addEventListener(event, nextVal)
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextVal)
    }
  }
}

export function insert(child: HTMLElement, parent: HTMLElement, anchor: any) {
  // parent.appendChild(child)
  parent.insertBefore(child, anchor || null)
}

export function remove(child: HTMLElement) {
  const parent = child.parentNode
  if (parent) {
    parent.removeChild(child)
  }
}

export function setElementText(el: HTMLElement, text: string) {
  el.textContent = text
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
})

export function createApp(...args: any) {
  return renderer.createApp(...args)
}

export * from '../runtime-core'
