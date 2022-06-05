import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

// transform 的职责是对 ast 进行增删改查
interface TransformContext {
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
  root.codegenNode = root.children[0]
}

function traverseNode(node: any, context: TransformContext) {
  const nodeTransforms = context.nodeTransforms

  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node)
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
    helper(key: string) {
      context.helpers.set(key, 1)
    },
  }

  return context
}
