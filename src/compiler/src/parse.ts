import { NodeTypes } from './ast'

export function baseParse(content: string) {
  const context = createParseContext(content)

  return createRoot(parseChildren(context))
}

function parseChildren(context: any) {
  const nodes = []
  let node

  if (context.source.startsWith('{{')) {
    node = parseInterpolation(context)
  }
  nodes.push(node)

  return nodes
}

function parseInterpolation(context: any) {
  // {{message}}
  // 这个过程是不断推进的，所以能看到字符串被处理过的部分都是被截取掉的
  // 剩下的都是没有被处理的
  const openDelimiter = '{{'
  const closeDelimiter = '}}'
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  )
  advanceBy(context, openDelimiter.length) // 截掉前面两个字符"{{"，并推进
  const rowContentLength = closeIndex - openDelimiter.length // 计算中间内容的长度
  const rawcontent = context.source.slice(0, rowContentLength) // 拿到真实的内容
  const content = rawcontent.trim() // 边缘处理
  advanceBy(context, rowContentLength + closeDelimiter.length) // 更新source，并推进

  console.log(111111111, context.source)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  }
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length)
}

function createParseContext(content: string) {
  return {
    source: content,
  }
}

function createRoot(children: any[]) {
  return {
    children,
  }
}
