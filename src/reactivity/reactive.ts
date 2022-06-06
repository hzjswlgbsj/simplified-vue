// reactivity 我画了一个简图可以参考：https://www.processon.com/view/link/629db3295653bb03f2ca9bb4

import { isObject } from '../shared'
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from './baseHandlers'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLI = '__v_isReadonly',
}

function createReactiveObject(target: any, baseHandlers: any) {
  if (!isObject(target)) {
    console.warn(`target ${target} Must be an object`)
    return target
  }
  return new Proxy(target, baseHandlers)
}

export function reactive(raw: any) {
  return createReactiveObject(raw, mutableHandlers)
}

export function isReactive(raw: any) {
  return !!raw[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(raw: any) {
  return !!raw[ReactiveFlags.IS_READONLI]
}

export function isProxy(value: any) {
  return isReadonly(value) || isReactive(value)
}

export function readonly(raw: any) {
  return createReactiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw: any) {
  return createReactiveObject(raw, shallowReadonlyHandlers)
}
