import { getCurrentInstance } from './component'

export function provide(key: string, value: any) {
  // 如何保存 provide 的值？
  // 这里保存的值需要利用到原型链，provide/inject是穿透性的
  // 中途的任何一个组件都有可能provide 相同的key，我们需要
  // 想原型链那样一层一层的访问
  const currentInstance = getCurrentInstance()

  if (currentInstance) {
    let { provides } = currentInstance
    const parentProvides = currentInstance.parent.provides
    // 当前组件实例中的provides的原型需要执行父亲节点的provides
    // 但是这个动作只能执行一次，初始化的时候，不然每次都会被覆盖
    // 如何区分是不是第一次初始化呢？
    // 1.我们在创建组件实例的时候 provides 的初始值被赋值为父亲
    // 的provides，所以当前的provides肯定 等于 父亲的provides
    // 2.如果provide方法被调用后当前的provides肯定 不等于 父亲的provides

    // 这里能直接判断对象是因为引用地址变了
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }

    provides[key] = value
  }
}

export function inject(key: string, defaultValue: any) {
  // 获取，是从父亲组件的provides里面拿
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides
    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) {
      if (typeof defaultValue === 'function') {
        return defaultValue()
      }
      return defaultValue
    }
  }
}
