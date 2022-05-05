class ReactiveEffect {
  private _fn: any

  constructor(fn) {
    this._fn = fn
  }

  run() {
    activeEffect = this
    return this._fn()
  }
}

const targetMap = new Map()
/**
 * 收集依赖
 * 1.我们需要一个容器（Dep）来收集依赖副作用（activeEffect）
 * 2.因为这个依赖是不重复的所以使用 Set 数据结构
 * @param target 目标对象
 * @param key 目标对象的key值
 */
export function track(target, key) {
  // Q: dep 我们应该存在哪里呢？
  // A: 首先数据流映射关系是 target ->（依对应） key ->（对应） dep，所以我们需要 Map 数据结构
  //    又因为这个track函数依赖过程是复用且频繁的，我们不需要重复申请Map结构，所以我们定义再函数外targetMap
  let depsMap = targetMap.get(target) // 通过target获取到deps
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }

  deps.add(activeEffect)
}

/**
 * 基于target 和 key 去取到对应的dep，并执行其中的fn
 * @param target 目标对象
 * @param key 目标对象的key值
 */
export function trigger(target, key) {
  let depsMap = targetMap.get(target) // 先取到目标对象的deps的集合
  let deps = depsMap.get(key)
  for (const effect of deps) {
    effect.run()
  }
}

let activeEffect // 保存当前正在被触发处理的副作用实例，执行run的时候被激活保存
export function effect(fn) {
  // fn
  const _effect = new ReactiveEffect(fn)
  _effect.run()

  return _effect.run.bind(_effect)
}
