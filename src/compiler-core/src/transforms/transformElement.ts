import { createVNodeCall, NodeTypes } from '../ast'
import { TransformContext } from '../transform'

export function transformElement(node: any, context: TransformContext) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // 中间处理层

      // tag
      const vnodeTag = `'${node.tag}'`

      // props
      let vnodeProps // 暂时不处理

      // children
      const children = node.children
      let vnodeChildren = children[0]

      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      )
    }
  }
}
