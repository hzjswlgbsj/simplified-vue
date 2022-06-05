// -----------------------------codegen 用于将 ast 生成 render 函数-------------------------------------
// vue 在线编译可以帮助查看编译后render：https://vue-next-template-explorer.netlify.app/
// 我画了简单的流程：https://www.processon.com/view/link/629c75621e08531a4012d60c

import { isString } from '../../shared'
import { NodeTypes } from './ast'
import {
  CREATE_ELEMENT_VNODE,
  helperNameMap,
  TO_DISPLAY_STRING,
} from './runtimeHelpers'

// case：
// 模板：<div>Hello World</div>
// 希望结果
// return function render(_ctx, _cache, $props, $setup, $data, $options) {
//   with (_ctx) {
//     const { openBlock: _openBlock, createElementBlock: _createElementBlock } = _Vue

//     return (_openBlock(), _createElementBlock("div", null, "Hello World"))
//   }
// }

interface CodegenContext {
  code: string
  push: (code: string) => void
  helper: (key: Symbol) => void
}

export function generate(ast: any) {
  const context = createCodegenContext()
  const { push } = context

  genFunctionPreamble(ast, context)
  const functionName = 'render'
  const args = ['_ctx, _cache']
  const signature = args.join(', ')

  push(`function ${functionName}(${signature}){`)
  push('return ')
  genNode(ast.codegenNode, context)
  push('}')

  return {
    code: context.code,
  }
}

// 生成function处理
function genFunctionPreamble(ast: any, context: CodegenContext) {
  const { push } = context
  const VueBinging = 'Vue'
  const aliasHelper = (s: string) => `${helperNameMap[s]}: _${helperNameMap[s]}`

  if (ast.helpers.length) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`)
  }
  push('\n')
  push('return ')
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source: string) {
      context.code += source
    },
    helper(key: any) {
      return `_${helperNameMap[key]}`
    },
  }

  return context
}

function genNode(node: any, context: CodegenContext) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.ELEMENT:
      genElement(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    default:
      break
  }
}

function genText(node: any, context: CodegenContext) {
  const { push } = context
  push(`'${node.content}'`)
}

function genInterpolation(node: any, context: CodegenContext) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(')')
}

function genExpression(node: any, context: CodegenContext) {
  const { push } = context
  push(node.content)
}

function genElement(node: any, context: CodegenContext) {
  const { push, helper } = context
  const { tag, children, props } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  genNodeList(genNullable([tag, props, children]), context)
  // genNode(children, context)
  push(')')
}

function genCompoundExpression(node: any, context: CodegenContext) {
  const children = node.children
  const { push } = context
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isString(child)) {
      push(child)
    } else {
      genNode(child, context)
    }
  }
}
function genNullable(args: any[]) {
  return args.map((arg) => arg || 'null')
}
function genNodeList(nodes: any[], context: CodegenContext) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node)) {
      push(node)
    } else {
      genNode(node, context)
    }

    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}
