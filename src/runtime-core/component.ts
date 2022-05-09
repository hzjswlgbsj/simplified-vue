export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
  }

  return component
}

export function setupComponent(instance: any) {
  // initProps // 初始化props

  // initSlots // 初始化slots
  setupStatefulComponent(instance) // 初始化有状态的组件
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type // 拿到组件options

  const { setup } = Component

  if (setup) {
    // 调用setup 得到xx ，可能是function和object
    const setupResult = setup()

    handleSetupResult(instance, setupResult)
  }
}

/**
 * 处理 component 定义中setup返回的值
 * @param setupResult Component的setup返回值
 */
function handleSetupResult(instance: any, setupResult: any) {
  // 如果是 function 的认为它就是组件的 render 函数，
  // 如果是 object 的话，会把object注入到组件上下文中
  // TODO function

  // object
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }

  // 保证render一定有值
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type

  if (!Component.render) {
    instance.render = Component.render
  }
}
