// 处理副作用，保存副作用以及触发副作用更新
import { extend } from '../shared'

export type EffectScheduler = (...args: any[]) => any
export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
  onStop?: () => void
}

export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

export let activeEffect: ReactiveEffect | undefined // 保存当前正在被触发处理的副作用实例，执行run的时候被激活保存
export const targetMap = new Map()
export let shouldTrack: boolean

export class ReactiveEffect<T = any> {
  private _fn: () => T
  onStop?: () => void
  deps: any[] = []
  active = true

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null
  ) {
    this._fn = fn
  }

  run() {
    if (!this.active) {
      return this._fn()
    }

    activeEffect = this
    shouldTrack = true

    const result = this._fn()
    shouldTrack = false // reset
    return result
  }

  stop() {
    if (this.active) {
      cleanupEffect(this)

      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    } else {
    }
  }
}

/**
 * 将activeEffect收集到dep中
 * @param dep 收集effect是容器是个Set结构
 */
export function trackEffects(dep: Set<any>) {
  // 如果当前的effect已经在dep中了就不需要再添加了
  if (dep.has(activeEffect)) {
    return
  }

  dep.add(activeEffect)
  activeEffect!.deps.push(dep)
}

/**
 * 从dep中删除不需要跟踪的副作用
 * @param effect ReactiveEffect 实例
 */
function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

export function isTracking() {
  return shouldTrack && typeof activeEffect !== 'undefined'
}

/**
 * 收集依赖
 * 1.我们需要一个容器（Dep）来收集依赖副作用（activeEffect）
 * 2.因为这个依赖是不重复的所以使用 Set 数据结构
 * 完整的 deps 保存的数据结构我画了图可以参考：https://www.processon.com/view/link/629db369e0b34d46d73bc3a6
 * @param target 目标对象
 * @param key 目标对象的key值
 */
export function track(target: any, key: string | symbol) {
  // Q: dep 我们应该存在哪里呢？
  // A: 首先数据流映射关系是 target ->（依对应） key ->（对应） dep，所以我们需要 Map 数据结构
  //    又因为这个track函数依赖过程是复用且频繁的，我们不需要重复申请Map结构，所以我们定义再函数外targetMap
  if (!isTracking()) {
    return
  }

  let depsMap = targetMap.get(target) // 通过target获取到deps
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  trackEffects(dep) // 将activeEffect收集到dep中
}

/**
 * 触发dep中的一系列副作用
 * @param dep 保存的effect集合
 */
export function triggerEffects(dep: Set<any>) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}

/**
 * 基于target 和 key 去取到对应的dep，并执行其中的fn
 * @param target 目标对象
 * @param key 目标对象的key值
 */
export function trigger(target: any, key: string | symbol) {
  let depsMap = targetMap.get(target) // 先取到目标对象的deps的集合
  if (depsMap) {
    let dep = depsMap.get(key)
    triggerEffects(dep)
  }
}

export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  if (!options) {
    options = {}
  }
  const _effect = new ReactiveEffect(fn, options.scheduler)

  // options 会有很多我们直接 assign
  // _effect.onStop = options.onStop
  extend(_effect, options)

  _effect.run()

  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop()
}
