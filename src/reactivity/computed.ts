/**
 * 计算属性实现的是比较巧妙的
 * 计算属性内部有一个effect，然后他有一个「get value」，当用户调用
 * 「get value」的时候，会去调用effect的run方法，也就是把用户传入的
 * fn的值返回出去。
 * Q: 然后他是怎么做到缓存的能力的呢？
 * A: 使用一个_dirty私有变量去标记当前这个传入的fn是否被调用过，如果没有
 *    被调用过执行effect的run的时候会将返回值缓存在_value中。第二次调用
 *    的时候直接返回这个缓存。
 * Q: 那如果被依赖的对象改变了的话怎么处理？
 * A: 此时我们就必须要用到 ReactiveEffect 的第二个参数 调度器（scheduler）了，
 *    scheduler 可以控制 run 方法的执行与否，如果依赖的对象发生改变的话，我们
 *    在 scheduler 中重置 _dirty 为 true 就行了。
 */

import { ReactiveEffect } from './effect'

class ComputedRefImpl<T = any> {
  private _getter: () => T
  private _value!: T
  public _dirty: boolean = true
  public readonly effect: ReactiveEffect<T>

  constructor(getter: () => T) {
    this._getter = getter
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
      }
    })
  }
  get value() {
    // 当依赖的响应式对象值发生改变的时候dirty被重置为true
    // 副作用effect正好能够做到

    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }

    return this._value
  }
}

export function computed<T = any>(getter: () => T) {
  return new ComputedRefImpl(getter)
}
