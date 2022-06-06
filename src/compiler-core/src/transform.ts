// transform 的职责是对 ast 进行增删改查

import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export interface TransformContext {
  root: any
  nodeTransforms: any[]
  helper: (key: Symbol) => void
  helpers: Map<string, number>
}

const TAG = 'src/compiler/src/transform'

export function transform(root: any, options: any = {}) {
  const context: TransformContext = createTransformContext(root, options)

  // 1. 深度优先搜索
  traverseNode(root, context)

  // 2.修改 ast，root.codegenNode
  createRootCodegen(root)

  root.helpers = [...context.helpers.keys()]
}

function createRootCodegen(root: any) {
  const child = root.children[0]
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode
  } else {
    root.codegenNode = root.children[0]
  }
}

function traverseNode(node: any, context: TransformContext) {
  const nodeTransforms = context.nodeTransforms
  const exitFns = []

  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    const onExit = transform(node, context)

    // 收集退出插件的尾函数
    if (onExit) {
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context)
      break
    default:
      break
  }

  // 开始执行收集到的插件尾函数
  let i = exitFns.length

  // 从后往前执行
  while (i--) {
    exitFns[i]()
  }
}

function traverseChildren(node: any, context: TransformContext) {
  const children = node.children

  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    traverseNode(node, context)
  }
}

function createTransformContext(root: any, options: any) {
  const context: TransformContext = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key: any) {
      context.helpers.set(key, 1)
    },
  }

  return context
}
