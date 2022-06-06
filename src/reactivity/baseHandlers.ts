import { track, trigger } from './effect'
import { reactive, ReactiveFlags, readonly } from './reactive'
import { isObject, extend } from '../shared'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

function createGetter(
  isReadonly: boolean = false,
  isShallowReadonly: boolean = false
) {
  return function get(target: any, key: string) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLI) {
      return isReadonly
    }

    const res = Reflect.get(target, key)

    // 如果是isShallowReadonly
    if (isShallowReadonly) {
      return res
    }

    // 如果 res 依然是 引用类型的话，我们需要让它也是响应式的
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    if (!isReadonly) {
      // 依赖收集
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

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
})
