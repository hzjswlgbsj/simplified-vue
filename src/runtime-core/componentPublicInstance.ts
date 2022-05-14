const publicPropertiesMap: { [key: string]: any } = {
  $el: (instance: any) => instance.vnode.el,
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }: any, key: string) {
    // 处理 setupState
    const { setupState } = instance
    if (key in setupState) {
      return setupState[key]
    }

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
}
