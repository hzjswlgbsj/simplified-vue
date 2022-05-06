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

class ReactiveEffect<T = any> {
  private _fn: any
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
    activeEffect = this
    return this._fn()
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

/**
 * 收集依赖
 * 1.我们需要一个容器（Dep）来收集依赖副作用（activeEffect）
 * 2.因为这个依赖是不重复的所以使用 Set 数据结构
 * @param target 目标对象
 * @param key 目标对象的key值
 */
export function track(target: any, key: string | symbol) {
  // Q: dep 我们应该存在哪里呢？
  // A: 首先数据流映射关系是 target ->（依对应） key ->（对应） dep，所以我们需要 Map 数据结构
  //    又因为这个track函数依赖过程是复用且频繁的，我们不需要重复申请Map结构，所以我们定义再函数外targetMap
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

  if (!activeEffect) {
    return
  }

  dep.add(activeEffect)
  activeEffect!.deps.push(dep)
}

/**
 * 基于target 和 key 去取到对应的dep，并执行其中的fn
 * @param target 目标对象
 * @param key 目标对象的key值
 */
export function trigger(target: any, key: string | symbol) {
  let depsMap = targetMap.get(target) // 先取到目标对象的deps的集合
  let deps = depsMap.get(key)
  for (const effect of deps) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
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
