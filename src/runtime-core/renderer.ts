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
import { EMPTY_OBJ } from '../shared'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { shouldUpdateComponent } from './componentUpdateUtils'
import { createAppAPI } from './createApp'
import { Fragment, Text, VNode } from './vnode'

const TAG = 'src/runtime-core/renderer'

export function createRenderer(options: any) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options
  function render(vnode: VNode, container: any) {
    // patch 派发更新
    patch(null, vnode, container, null, null)
  }

  /**
   * 根据虚拟节点类型触发对应的视图更新
   * @param n1 旧（上一次）的 vnode
   * @param n2 新（本次）的 vnode
   * @param container 根容器dom
   * @param parentComponent 父组件
   */
  function patch(
    n1: VNode | null,
    n2: VNode,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    const { shapeFlag, type } = n2 // 拿到状态flag

    // Fragment -> 只渲染 children ，不增加一个div包裹
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        // 判断vnode是不是element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理element
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  function processText(n1: VNode | null, n2: VNode, container: any) {
    // Text 类型
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.appendChild(textNode)
  }

  function processFragment(
    n1: VNode | null,
    n2: VNode,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    // fragment 类型
    mountChildren(n2.children, container, parentComponent, anchor)
  }

  function processElement(
    n1: VNode | null,
    n2: VNode,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    // 旧节点不存在说明是初始化，那就初始化挂载
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      // 更新
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }

  function processComponent(
    n1: VNode | null,
    n2: VNode,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    // 没有老节点代表是初始化渲染
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor) // 挂载组件
    } else {
      updateComponent(n1, n2) // 更新组件
    }
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
    parentComponent: any,
    anchor: any
  ) {
    // 首先创建一个组件实例，并将实例保存到VNode上
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ))

    // 然后去构建实例中必须的数据
    setupComponent(instance)

    // 递归渲染组件实例
    setupRenderEffect(instance, initialVNode, container, anchor)
  }
  /**
   * 更新组件类型的vnode
   * 更新组件无非就是调用当前组件的render函数生成新的VNode，再进行patch
   * @param n1 旧的组件节点
   * @param n2 新的组件节点
   */
  function updateComponent(n1: VNode, n2: VNode) {
    // 从旧组件VNode中拿到老的实例并赋值给新组件VNode的实例以便于下次更新能找到正确的实例
    const instance = (n2.component = n1.component)

    // 判断是否需要触发更新
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2 // 保存新的VNode到实例
      instance.update()
    } else {
      n2.el = n1.el // 不需要更新的话将新的节点的el直接赋值为旧的
      instance.vnode = n2 // 更新当前实例上挂的vnode为新的
    }
  }

  /**
   * 处理 dom 类型的节点，这里封装了一套接口，dom 的方法我们抽到runtime-dom中，这里是调用外部
   * 创建自定义渲染器传进来的一套api：hostCreateElement,hostPatchProp, hostInsert
   * 注意：初始化流程的时候才会执行全量挂载，如果是更新操作的话会执行patchElement去直接更新需要跟新的节点
   * @param vnode 虚拟节点
   * @param container 根容器
   * @param parentComponent 父节点
   */
  function mountElement(
    vnode: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
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
      mountChildren(vnode.children, el, parentComponent, anchor)
    }

    // 处理元素的属性 props
    for (const key in props) {
      const val = props[key]
      hostPatchProp(el, key, null, val)
    }

    hostInsert(el, container, anchor)
  }

  /**
   * 根据新旧虚拟节点来更新 element 的视图，这个过程比较复杂，这里会拆分问题:
   * 更新props、
   * @param n1 更新前的vnode
   * @param n2 本次要更新的vnode
   * @param container 根容器
   * @param parentComponent 父组件
   */
  function patchElement(
    n1: VNode,
    n2: VNode,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    console.log(TAG, 'patchElement', '开始执行DOM元素类型的更新操作', n1, n2)

    /* 更新 props */
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    // 想想 el 在哪里赋值的？在 mountElement 的时候不仅创建了el还将它赋值到了vnode上
    // 同理 我们这里需要将更新前的el赋值给更新后的vnode上，确保下一次的更新 vnode上有el
    const el = (n2.el = n1.el)

    patchProps(el, oldProps, newProps)

    /* 更新 children */
    patchChildren(n1, n2, el, parentComponent, anchor)
  }

  /**
   * 对比更新新旧 props
   * 更新 props 主要有三种场景
   * 1.之前的值和现在的值不一样了【修改操作】
   * 2.值或者属性变成 null 或者 undefined【删除操作】
   * 3.props 对象中的某个属性被删除【删除操作】
   * @param el 第一次初始化的时候创建的el，在mountElement方法中被赋值并保存到vnode中
   * @param oldProps 旧的 props
   * @param newProps 新的 props
   */
  function patchProps(el: HTMLElement, oldProps: any, newProps: any) {
    console.log(
      TAG,
      'patchProps',
      '开始执行DOM元素类型的更新操作-处理属性',
      el,
      oldProps,
      newProps
    )

    if (oldProps !== newProps) {
      // 遍历新的props 修改需要修改的，如果有属性变成undefined或者null那么删除
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]

        // 更新
        if (prevProp !== nextProp) {
          // 使用接口中用户提供的props处理函数完成更新
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }

      if (oldProps !== EMPTY_OBJ) {
        // 遍历旧的props，检查在新的props中是否存在
        for (const key in oldProps) {
          // 如果不存在就删除
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  /**
   * 根据新老虚拟节点更新 children
   * 这里我们需要对比新老节点的情况，一共有4中情况
   * case1： 老的节点是 array 新的节点是 text
   * case2： 老的节点是 text 新的节点是 text
   * case3： 老的节点是 text 新的节点是 array
   * case4： 老的节点是 array 新的节点是 array
   * @param n1 旧（上一次）的 vnode
   * @param n2 新（本次）的 vnode
   * @param container 父级容器element节点
   * @param parentComponent 父组件
   */
  function patchChildren(
    n1: VNode,
    n2: VNode,
    container: HTMLElement,
    parentComponent: any,
    anchor: any
  ) {
    const prevShapeFlag = n1.shapeFlag
    const nextShapeFlag = n2.shapeFlag
    const c1 = n1.children
    const c2 = n2.children

    // 注意：case1 和 case2 两种情况代码可以合并，但是为了可读性好并没有采用，合并的代码注释在下面了

    // case1：如果新的节点是一个文本节点，并且老的节点是一个 array
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1.将原来的 children 完全清空
        unmountChildren(n1.children)

        // 2.在其位置上插入新的文本节点
        hostSetElementText(container, c2)
      }
    }

    // case2：如果新的节点是一个文本节点，并且老的节点也是一个文本节点
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 直接替换即可
        hostSetElementText(container, c2)
      }
    }

    // case3：如果新的节点是一个array节点，老的节点是一个文本节点
    if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 1.将原来的 text 完全清空
        hostSetElementText(container, '')

        // 2.挂载 children
        mountChildren(n2.children, container, parentComponent, anchor)
      }
    }

    // case4：如果新的节点是一个array节点，老的节点也是一个array
    // 这种情况比较复杂了，需要diff array
    if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        patchKeyedChildren(c1, c2, container, parentComponent, anchor) // diff
      }
    }

    /* 合并后的代码 */
    // if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
    //   if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //     unmountChildren(n1.children)
    //   }

    //   if (n1.children !== n2.children) {
    //     hostSetElementText(container, newChildren)
    //   }
    // } else {
    //   if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
    //     hostSetElementText(container, '')
    //     mountChildren(n2.children, container, parentComponent)
    //   }
    // }
  }

  /**
   * 为新旧两个节点的 children 都是 array 的情况下做 diff 算法
   * 以此来节约重复创建 DOM 所带来的性能消耗，diff的思想是：
   * 找到新旧节点左右相同的节点，收敛出中间一个变化的区间，在收敛左右的
   * 时候，如果发现新旧节点的增减节点直接进行增删，最后得到新旧节点两个
   * 收敛区间，收敛区间再去检测是否有可复用的节点，因为用户可能仅仅是交换的节点位置
   *
   * 首先定义三个指针：
   * let i = 0 // 左侧第一个不同的指针下标
   * let e1 = c1.length - 1 // 旧节点右侧（从右往左）第一个不同的指针下标
   * let e2 = c2.length - 1 // 新节点右侧（从右往左）第一个不同的指针下标
   * 1.从左侧开始向右侧遍历直到找到新旧节点左侧第一个不同的指针下标得到一个i
   * 2.从最右侧向左侧遍历直到找到新旧节点第一个不同的指针下标，得到e1, e2
   * 3.新的比旧的长，创建新节点多出来的节点
   * 4.旧的比新的长，删除老节点多出来的节点
   * 5.中间对比
   *   5.1 删除旧的（在旧的里面存在，新的里面不存在）
   *   5.2 移动（节点存在于新的和老的里面，但是位置变了）
   *   5.3 创建新的（在旧的里面不存在，新的里面存在）
   * @param c1 旧节点的children
   * @param c2 新节点的children
   * @param container 父级容器element节点
   * @param parentComponent 父组件
   */
  function patchKeyedChildren(
    c1: any,
    c2: any,
    container: any,
    parentComponent: any,
    parentAnchor: any
  ) {
    let i = 0 // 新旧节点左侧第一个不同的指针下标
    let e1 = c1.length - 1 // 旧节点右侧（从右往左）第一个不同的指针下标
    let e2 = c2.length - 1 // 新节点右侧（从右往左）第一个不同的指针下标

    function isSameVNodeType(n1: any, n2: any) {
      return n1.type === n2.type && n1.key === n2.key
    }

    // 1.左侧对比
    // 先遍历两个children 直到左侧的不同之处开始的下标
    // 如果是相同的那就直接patch
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }

      i++
    }

    // 2.右侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }

      e1--
      e2--
    }

    // 3.新的比旧的长，创建操作
    if (i > e1) {
      if (i <= e2) {
        const nextPods = e2 + 1
        const anchor = nextPods < c2.length ? c2[nextPods].el : null
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    }

    // 4.旧的比新的长,删除老的多出不得部分
    if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    }

    // 5.中间对比
    // 5.1 删除旧的（在旧的里面存在，新的里面不存在）
    let s1 = i // 旧节点的开始位置（这里指的是被收敛的区间的开始的第一个位置下标）
    let s2 = i // 新节点的开始位置（这里指的是被收敛的区间的开始的第一个位置下标）
    const toBePatched = e2 - s2 + 1 // 记录新节点的需要更新的总数量
    let patched = 0 // 当前处理的数量
    const keyToNewIndexMap = new Map() // 为新节点建立缓存映射表，以减少不必要的遍历查找
    const newIndexToOldIndexMap = new Array(toBePatched)
    let moved = false
    let maxNewIndexSoFar = 0

    for (let i = 0; i < toBePatched; i++) {
      newIndexToOldIndexMap[i] = 0
    }

    for (let i = s2; i <= e2; i++) {
      const nextChild = c2[i]
      keyToNewIndexMap.set(nextChild.key, i)
    }

    // 遍历老节点查找每一个老节点在新节点中是否存在
    for (let i = s1; i <= e1; i++) {
      const prevChild = c1[i]
      let newIndex

      // 如果处理的数量大于新节点更新的总数量的话，说明老节点又多余的新节点中没有的节点，直接删除
      if (patched >= toBePatched) {
        hostRemove(prevChild.el)
        continue
      }

      // 如果用户写了key那就从缓存里去查找，否则遍历查找
      if (prevChild.key !== null) {
        newIndex = keyToNewIndexMap.get(prevChild.key)
      } else {
        for (let j = s2; j <= e2; j++) {
          if (isSameVNodeType(prevChild, c2[j])) {
            newIndex = j
            break
          }
        }
      }

      // 如果newIndex不存在那么说明当前节点在新的改动中不存在，那么删除掉它
      // 如果存在的话继续 patch 对比下层
      if (newIndex === undefined) {
        hostRemove(prevChild.el)
      } else {
        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex
        } else {
          // 如果新得到的节点的位置小于上一个节点位置那么认为新的节点被移动过位置
          moved = true
        }

        newIndexToOldIndexMap[newIndex - s2] = i + 1
        patch(prevChild, c2[newIndex], container, parentComponent, null)
        patched++
      }
    }

    // 5.2 移动（节点存在于新的和老的里面，但是位置变了）
    // 为了减少移动的次数，我们需要找到最长递增子序列
    // 最长递增子序列：https://leetcode.cn/problems/longest-increasing-subsequence/
    // 没有最长递增子序列的效果就是收敛区间中的所有节点都被遍历一遍逐个检查是否要移动
    const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap)
      : []
    let j = increasingNewIndexSequence.length - 1 // 最长递增子序列的指针

    // 遍历新节点，将中间收敛区域与最长递增子序列做对比
    // 从后往前插入，因为前面的的节点是不稳定的
    for (let i = toBePatched - 1; i >= 0; i--) {
      const nextIndex = i + s2
      const nextChild = c2[nextIndex]
      const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null

      // 5.3 创建新的（在旧的里面不存在，新的里面存在）
      // 在映射中的值还是0的话说明没有
      if (newIndexToOldIndexMap[i] === 0) {
        patch(null, nextChild, container, parentComponent, anchor)
      } else if (moved) {
        // 如果当前i不等于最长递增子序列的值，那需要被移动位置
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          console.log(TAG, 'patchKeyedChildren', '中间对比-需要移动', i)
          hostInsert(nextChild.el, container, anchor)
        } else {
          j--
        }
      }
    }
  }

  /**
   * 将子节点从当前节点移除
   * @param children 子节点
   */
  function unmountChildren(children: any[]) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      // remove
      hostRemove(el)
    }
  }

  /**
   * 根据组件实例 递归渲染，过程为先 通过调用组件实例的render获取到vnode树，然后patch
   * patch 会递归判断 vnode 的节点类型，最终会执行到 mountElement，更新到相应的DOM
   * @param instance 组件实例
   * @param initialVNode 根实例的节点
   * @param container 根容器
   * @param anchor 添加元素的时候所需要的锚点位置
   */
  function setupRenderEffect(
    instance: any,
    initialVNode: VNode,
    container: any,
    anchor: any
  ) {
    // 用 effect 来将视图更新流程作为副作用，当依赖发生改变的时候会再次执行视图更新流程
    // 这个过程中会地爱用render生成新的vnode tree，然后通过 patch 更新

    // 注意：有些同学可能不理解这里明明只执行了副作用，又没有跟响应式关联起来怎么会被再次执行呢？

    // 首先，我们要做到响应式视图更新，那我们在 h 函数或者 <template> 中必定要使用响应式数据
    // 有可能是ref()或者reactive()定义的变量，那其实在第一次被渲染的时候（也就是调用本方法）的
    // 时候执行了这里的 effect，effect 中的run被代用那么此时 activeEffect 是不是就保存了现
    // 在这个更新视图流程的副作用，那么下次 ref()或者reactive()定义的数据改变后，这个副作用
    // 再次被执行是不是相当于重新跑了一遍新的render->patch流程

    // 视图中依赖的每一个变量都会收集依赖副作用，所以视图中任意变量改变都会重新跑一次本函数
    // effect 函数会返回一个runner 用于手动执行回调fn，在这里保存runner到实例上便于组件更新操作
    instance.update = effect(() => {
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
        patch(null, subTree, container, instance, anchor)
        instance.isMounted = true // 初始化都标识为已挂载

        // 这里所有的element都被mount了
        initialVNode.el = subTree.el

        console.log(
          TAG,
          'setupRenderEffect',
          '执行了初始化渲染',
          instance,
          subTree
        )
      } else {
        /* 更新流程 */
        // next: 即将更新的VNode, vnode: 原来（更新前）的 vnode
        const { next, vnode } = instance
        if (next) {
          next.el = vnode.el // 先将el替换
          updateComponentPreRender(instance, next) // 更新组件属性
        }
        const { proxy } = instance
        const subTree = instance.render.call(proxy) // 得到最新的 subTree
        const preSubTree = instance.subTree // 获取上一次的subTree
        instance.subTree = subTree // 更新最新的subTree
        patch(preSubTree, subTree, container, instance, anchor)

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
    children: any,
    container: HTMLElement,
    parentComponent: any,
    anchor: any
  ) {
    children.forEach((v: any) => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}

function updateComponentPreRender(instance: any, nextVnode: VNode) {
  instance.vnode = nextVnode
  instance.next = null
  instance.props = nextVnode.props // 更新props，这里是简单处理直接赋值的
}

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
