// Ref 的实现
import { isTracking, trackEffects, triggerEffects } from './effect'
import { hasChanged, isObject } from '../shared'
import { reactive } from './reactive'

class RefImpl {
  private _value: any
  private _rawValue: any
  public dep: Set<any>
  public __v_isRef: boolean = true

  constructor(value: any) {
    this._rawValue = value // 保存一个没有处理过的value
    // Ref 也要支持对象，这边得分开处理
    // 对象类型的处理我们已经有reactive 可以用了
    this._value = convert(value)
    this.dep = new Set()
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newValue: any) {
    // 如果值没有改变则不处理
    if (hasChanged(this._rawValue, newValue)) {
      // 一定是先修改了value值再去做trigger
      this._rawValue = newValue
      this._value = convert(newValue)
      triggerEffects(this.dep) // 触发副作用
    }
  }
}

function convert(value: any) {
  return isObject(value) ? reactive(value) : value
}

function trackRefValue(ref: RefImpl) {
  if (isTracking()) {
    trackEffects(ref.dep) // 依赖收集
  }
}

/**
 * 创建一个值类型的响应式数据
 * Q: ref 为什么要使用 Object.defineproperty 而 reactive 要用 Proxy 来做拦截？
 * A: 首先要明白的是，JavaScript 的数据类型有两大类，基本类型和引用类型。Proxy 拦截
 *    的是引用类型，那值类型呢？很自然就想到了将基本类型放到一个对象中去，然后去拦截对象，
 *    所以使用 ref 定义的响应式数据在访问的时候需要用 .value才能正确获取。
 * @param value 值
 * @returns
 */
export function ref(value?: any) {
  return new RefImpl(value)
}

export function isRef(ref: RefImpl | any) {
  return !!ref.__v_isRef
}

/**
 * 实现Ref与普通对象取值无差异化
 * @param ref RefImpl对象或者普通对象
 * @returns
 */
export function unRef(ref: RefImpl | any) {
  return isRef(ref) ? ref.value : ref
}

/**
 * 代理ref取值，使得ref对象不需要每次访问属性都需要「.value」
 * @param raw 被代理对象
 */
export function proxyRefs(objectWithRefs: any) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      // get -> age(ref) 就返回.value
      // get -> age(not ref) 就返回 age
      return unRef(Reflect.get(target, key))
    },

    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value)
      } else {
        return Reflect.set(target, key, value)
      }
    },
  })
}
