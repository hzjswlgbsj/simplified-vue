import { isTracking, trackEffects, triggerEffects } from './effect'
import { hasChanged, isObject } from '../shared'
import { reactive } from './reactive'

class RefImpl {
  private _value: any
  private _rawValue: any
  public dep: Set<any>

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

export function ref(value: any) {
  return new RefImpl(value)
}
