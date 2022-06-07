import { proxyRefs } from '../reactivity'
import { shallowReadonly } from '../reactivity/reactive'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'
const TAG = 'runtime-core/component'
let currentInstance: any = null
let compiler: any
/**
 * 根据vnode来生成一个组件实例
 * @param vnode 虚拟节点
 * @param parent 父节点
 * @returns 组件实例
 */
export function createComponentInstance(vnode: any, parent: any) {
  const component = {
    vnode,
    type: vnode.type,
    next: null, // 本次即将被更新的VNode
    setupState: {}, // 保存setup方法中的变量，方法等等
    props: {},
    slots: {},
    provides: parent ? parent.provides : {}, // 指向父亲实例的provide便于取值
    parent,
    emit: () => {},
    isMounted: false,
    subTree: {},
  }

  component.emit = emit.bind(null, component) as any
  return component
}

/**
 * 初始化组件实例，准备组件必须的数据
 * @param instance 组件实例
 */
export function setupComponent(instance: any) {
  // 初始化props
  initProps(instance, instance.vnode.props)

  // 初始化slots
  initSlots(instance, instance.vnode.children)

  setupStatefulComponent(instance) // 初始化有状态的组件
}

/**
 * 初始化组件中的各种状态
 * @param instance 组件实例
 */
function setupStatefulComponent(instance: any) {
  const Component = instance.type // 拿到组件options

  // 代理对象，使得实例中可以直接通过this.xxx访问到setup中，$data。。。中的变量
  // 不需要再写this.data.xxxx -> this.xxxx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  const { setup } = Component

  if (setup) {
    setCurrentInstance(instance)
    // 调用setup 得到vue3的setup执行后返回的状态对象 ，可能是function和object
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })

    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
    console.log(TAG, 'setupStatefulComponent->初始化组件结束', instance)
  }
}

/**
 * 处理 component 定义中setup返回的值
 * @param setupResult Component的setup返回值
 */
function handleSetupResult(instance: any, setupResult: any) {
  // 如果是 function 的话认为它就是组件的 render 函数，
  // 如果是 object 的话，会把object注入到组件上下文中
  // TODO function

  // object，使用proxyRefs代理，使得在使用setup返回变量的时候不需要手动添加.value
  if (typeof setupResult === 'object') {
    instance.setupState = proxyRefs(setupResult)
  }

  // 保证render一定有值
  finishComponentSetup(instance)
}

/**
 * 保证组件实例中包含render函数
 * @param instance 组件实例
 */
function finishComponentSetup(instance: any) {
  const Component = instance.type

  // 如果没有render函数则用template生成render函数
  if (compiler && !Component.render) {
    Component.render = compiler(Component.template)
  }

  instance.render = Component.render
}

/**
 * 获取当前组件实例
 */
export function getCurrentInstance() {
  return currentInstance
}

export function setCurrentInstance(instance: any) {
  currentInstance = instance
}

export function registerRuntimeCompiler(_compiler: any) {
  compiler = _compiler
}
