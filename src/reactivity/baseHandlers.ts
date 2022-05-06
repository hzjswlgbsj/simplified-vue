import { track, trigger } from './effect'
import { ReactiveFlags } from './reactive'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)

function createGetter(isReadonly: boolean = false) {
  return function get(target: any, key: string) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLI) {
      return isReadonly
    }

    const res = Reflect.get(target, key)

    if (!isReadonly) {
      // TODO 依赖收集
      track(target, key)
    }

    return res
  }
}

export function createSetter() {
  return function set(target: any, key: string, value: any) {
    const res = Reflect.set(target, key, value)

    // TODO 触发依赖
    trigger(target, key)
    return res
  }
}

export const mutableHandlers = {
  get,
  set,
}

export const readonlyHandlers = {
  get: readonlyGet,

  set(target: any, key: string, value: any) {
    console.warn(
      `key: ${key} setting failed because target is read-only`,
      target,
      value
    )
    return true
  },
}
