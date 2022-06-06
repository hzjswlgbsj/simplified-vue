import { NodeTypes } from '../src/ast'
import { baseParse } from '../src/parse'
import { transform } from '../src/transform'

describe('Parse', () => {
  // 简单的插值处理{{}}
  describe('transform', () => {
    test('happy path', () => {
      const ast = baseParse('<div>hi，{{ message }}</div>')

      const plugin = (node: any) => {
        if (node.type === NodeTypes.TEXT) {
          node.content = node.content + 'vue'
        }
      }

      transform(ast, {
        nodeTransforms: [plugin],
      })

      const nodeText = ast.children[0].children[0]
      expect(nodeText.content).toBe('hi，vue')
    })
  })
})
