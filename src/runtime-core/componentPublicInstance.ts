import { hasOwn } from '../shared'

const publicPropertiesMap: { [key: string]: any } = {
  $el: (instance: any) => instance.vnode.el,
  $slots: (instance: any) => instance.slots,
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }: any, key: string) {
    const { setupState, props } = instance

    if (hasOwn(setupState, key)) {
      // 处理 setupState 返回值
      return setupState[key]
    } else if (hasOwn(props, key)) {
      // 处理 props 返回值
      return props[key]
    }

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
}
