// transform 的职责是对 ast 进行增删改查

interface TransformContext {
  root: any
  nodeTransforms: any[]
}

const TAG = 'src/compiler/src/transform'

export function transform(root: any, options: any) {
  const context: TransformContext = createTransformContext(root, options)

  // 1. 深度优先搜索
  traverseNode(root, context)

  // 2.修改 text content
}

function traverseNode(node: any, context: TransformContext) {
  console.log(TAG, 'traverseNode', node)

  const nodeTransforms = context.nodeTransforms

  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node)
  }

  traverseChildren(node, context)
}

function traverseChildren(node: any, context: TransformContext) {
  const children = node.children

  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      traverseNode(node, context)
    }
  }
}

function createTransformContext(root: any, options: any) {
  const context: TransformContext = {
    root,
    nodeTransforms: options.nodeTransforms || [],
  }

  return context
}
