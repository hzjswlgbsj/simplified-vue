//---------------------------createRenderer-------------------------------
// 将节点的整个渲染过程在抽象一层，让各个平台都能有一套自己的渲染逻辑，比如：
// 整个render过程其实就是递归vnode，最终都是要到mountElement，元素处理
// 这一层，可以看到元素处理主要有三个部分：
// 1.创建元素
// 2.处理元素属性
// 3.将元素挂到容器
// 在DOM平台对应：
// 1.document.createElement
// 2.setAttribute、addEventListener...
// 3.appendChild、insertBefore...

// 那如果想渲染其他平台元素怎么处理呢？
// 所以就有了现在这一层抽象，把上面提到的1, 2, 3点暴露接口给外部，只提供
// createRenderer 来创建一个 render ，这样我们的框架就具备了自定义渲染
// 流程的能力，当然这只是建的处理1,2,3正式情况可能会更加复杂，会有4,5，6...

// 在example/customRenderer 中结合了 pixijs 示范创建一个canvas平台的
// 自定义渲染流程

import { effect } from '../reactivity'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { Fragment, Text } from './vnode'

const TAG = 'src/runtime-core/renderer'

export function createRenderer(options: any) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options
  function render(vnode: any, container: any) {
    // patch 派发更新
    patch(null, vnode, container, null)
  }

  /**
   * 根据虚拟节点类型触发对应的视图更新
   * @param n1 旧（上一次）的 vnode
   * @param n2 新（本次）的 vnode
   * @param container 根容器dom
   * @param parentComponent 父组件
   */
  function patch(n1: any, n2: any, container: any, parentComponent: any) {
    const { shapeFlag, type } = n2 // 拿到状态flag

    // Fragment -> 只渲染 children ，不增加一个div包裹
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        // 判断vnode是不是element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理element
          processElement(n1, n2, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(n1, n2, container, parentComponent)
        }
        break
    }
  }

  function processText(n1: any, n2: any, container: any) {
    // Text 类型
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.appendChild(textNode)
  }

  function processFragment(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    // fragment 类型
    mountChildren(n2, container, parentComponent)
  }

  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    // 旧节点不存在说明是初始化，那就挂载
    if (!n1) {
      mountElement(n2, container, parentComponent)
    } else {
      // 更新
      patchElement(n1, n2, container)
    }
  }

  function processComponent(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    // 挂载组件
    mountComponent(n2, container, parentComponent)
  }

  /**
   * 挂载组件类型的vnode
   * @param initialVNode 初始化的虚拟节点
   * @param container 根容器
   * @param parentComponent 父节点
   */
  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent: any
  ) {
    // 首先创建一个组件实例
    const instance = createComponentInstance(initialVNode, parentComponent)

    // 然后去构建实例中必须的数据
    setupComponent(instance)

    // 递归渲染组件实例
    setupRenderEffect(instance, initialVNode, container)
  }

  /**
   * 处理 dom 类型的节点，这里封装了一套接口，dom 的方法我们抽到runtime-dom中，这里是调用外部
   * 创建自定义渲染器传进来的一套api：hostCreateElement,hostPatchProp, hostInsert
   * 注意：初始化流程的时候才会执行全量挂载，如果是更新操作的话会执行patchElement去直接更新需要跟新的节点
   * @param vnode 虚拟节点
   * @param container 根容器
   * @param parentComponent 父节点
   */
  function mountElement(vnode: any, container: any, parentComponent: any) {
    console.log(TAG, 'mountElement', '开始执行DOM元素类型的的初始化挂载', vnode)
    // 注意：这里的vnode是element类型
    const el = (vnode.el = hostCreateElement(vnode.type))
    const { children, props, shapeFlag } = vnode

    // 处理children， children也分为 string和数组
    // 如果是string的话就直接是文本节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果是数组的话挂载children
      mountChildren(vnode, el, parentComponent)
    }

    // 处理元素的属性 props
    for (const key in props) {
      const val = props[key]
      hostPatchProp(el, key, val)
    }

    hostInsert(el, container)
  }

  function patchElement(n1: any, n2: any, container: any) {
    console.log(TAG, 'patchElement', '开始执行DOM元素类型的更新操作', n1, n2)
  }

  /**
   * 根据组件实例 递归渲染，过程为先 通过调用组件实例的render获取到vnode树，然后patch
   * patch 会递归判断 vnode 的节点类型，最终会执行到 mountElement，更新到相应的DOM
   * @param instance 组件实例
   * @param initialVNode 根实例的节点
   * @param container 根容器
   */
  function setupRenderEffect(instance: any, initialVNode: any, container: any) {
    // 用 effect 来将视图更新流程作为副作用，当依赖发生改变的时候会再次执行视图更新流程
    // 这个过程中会地爱用render生成新的vnode tree，然后通过 patch 更新

    // 注意：有些同学可能不理解这里明明只执行了副作用，又没有跟响应式关联起来怎么会被再次执行呢？

    // 首先，我们要做到响应式视图更新，那我们在 h 函数或者 <template> 中必定要使用响应式数据
    // 有可能是ref()或者reactive()定义的变量，那其实在第一次被渲染的时候（也就是调用本方法）的
    // 时候执行了这里的 effect，effect 中的run被代用那么此时 activeEffect 是不是就保存了现
    // 在这个更新视图流程的副作用，那么下次 ref()或者reactive()定义的数据改变后，这个副作用
    // 再次被执行是不是相当于重新跑了一遍新的render->patch流程

    // 视图中依赖的每一个变量都会收集依赖副作用，所以视图中任意变量改变都会重新跑一次本函数
    effect(() => {
      // 触发 render -> path 流程现在就有两种情况了：1.初始化渲染 2.更新渲染
      // 所有我们要区分出哪些是更新流程哪些是初始化，并且只更新需要更新的vnode

      // 在实例中增加isMounted，如果被挂载过了，说明是更新操作，否则是初始化渲染
      if (!instance.isMounted) {
        // 注意之前我们做了instance 的代理（setupStatefulComponent方法中）
        // 所以这里的 proxy 是 instance 的代理
        const { proxy } = instance
        // 调用render获得虚拟节点树，并保存初始化的时候的subTree，便于在更新的时候拿到旧的
        // subTree 与新的 subTree 做对比
        const subTree = (instance.subTree = instance.render.call(proxy))

        // vnode -> patch -> element -> mountElement
        patch(null, subTree, container, instance)
        instance.isMounted = true // 初始化都标识为已挂载

        // 这里所有的element都被mount了
        initialVNode.el = subTree.el

        // 处理 diff
        console.log(
          TAG,
          'setupRenderEffect',
          '执行了初始化渲染',
          instance,
          subTree
        )
      } else {
        const { proxy } = instance
        const subTree = instance.render.call(proxy) // 得到最新的 subTree
        const preSubTree = instance.subTree // 获取上一次的subTree
        instance.subTree = subTree // 更新最新的subTree
        patch(preSubTree, subTree, container, instance)
        console.log(
          TAG,
          'setupRenderEffect',
          '执行了更新渲染',
          instance,
          subTree,
          preSubTree
        )
      }
    })
  }

  function mountChildren(
    vnode: any,
    container: HTMLElement,
    parentComponent: any
  ) {
    vnode.children.forEach((v: any) => {
      patch(null, v, container, parentComponent)
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}
