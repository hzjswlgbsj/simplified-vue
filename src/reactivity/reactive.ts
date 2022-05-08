import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from './baseHandlers'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLI = '__v_isReadonly',
}

function createActiveObject(raw: any, baseHandlers: any) {
  return new Proxy(raw, baseHandlers)
}

export function reactive(raw: any) {
  return createActiveObject(raw, mutableHandlers)
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
  return createActiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw: any) {
  return createActiveObject(raw, shallowReadonlyHandlers)
}
