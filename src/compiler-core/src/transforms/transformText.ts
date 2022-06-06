import { NodeTypes } from '../ast'
import { TransformContext } from '../transform'
import { isText } from '../utils'

/**
 * 创建一种符合类型的 ast 节点，他是 text 和插值类型的组合
 * @param node node
 * @param context TransformContext
 */
export function transformText(node: any, context: TransformContext) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node
      let currentContainer
      for (let i = 0; i < children.length; i++) {
        const child = children[i]

        // 如果是一个文本节点或者插值节点，继续搜索相邻的
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if (isText(next)) {
              if (!currentContainer) {
                // 这个容器就是新创建出来的ast复合类型节点
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                }
              }

              currentContainer.children.push(' + ')
              currentContainer.children.push(next)
              children.splice(j, 1) // 删除已经添加过的next
              j-- // 因为splice删除元素后，后面的元素会自动移动到前面，所以这里要更新j指针位置
            } else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
}
