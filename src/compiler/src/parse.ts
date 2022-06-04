import { NodeTypes } from './ast'

export const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParseContext(content)

  return createRoot(parseChildren(context))
}

function parseChildren(context: any) {
  const nodes = []
  let node
  const s = context.source

  if (s.startsWith('{{')) {
    // 普通的插值类型
    node = parseInterpolation(context)
  } else if (s[0] === '<') {
    // element 类型
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context)
    }
  }

  // 如果 node 没有值说明不是插值或者 element 认为是一个普通字符串
  if (!node) {
    node = parseText(context)
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
  const rawcontent = context.source.slice(0, rowContentLength)
  parseTextData(context, rowContentLength) // 拿到真实的内容，并删除处理完的数据并推进
  const content = rawcontent.trim() // 边缘处理
  advanceBy(context, closeDelimiter.length) // 在 parseTextData 中已经推进了内容的长度，再次经closeDelimiter删除并推进即可

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  }
}

function parseElement(context: any) {
  // 1.解析元素tag
  // 2.删除处理完成的代码

  const element = parseTag(context, TagType.Start) // 解析出tag，并删除标签左边部分（<div>），并推进
  parseTag(context, TagType.End) // 删除标签右边部分（</div>），并推进

  return element
}

function parseTag(context: any, type: TagType) {
  // 1.解析元素tag
  const match: any = /^<\/?([a-z]*)/i.exec(context.source)
  const tag = match[1] // 先默认都是能解析出来的正确代码

  // 2.删除处理完成的代码，并推进
  advanceBy(context, match[0].length) // 删除左边并推进
  advanceBy(context, 1) // 删除右尖括号

  // 如果是结束标签的话不需要返回element
  if (type === TagType.End) {
    return
  }
  return {
    type: NodeTypes.ELEMENT,
    tag,
  }
}

function parseText(context: any) {
  // 获取内容，并删除和推进
  const content = parseTextData(context, context.source.length)

  return {
    type: NodeTypes.TEXT,
    content,
  }
}

/**
 * 获取文本内容并推进
 * @param context context
 * @param length 要删除并推进的长度
 */
function parseTextData(context: any, length: number) {
  // 1.获取内容
  const content = context.source.slice(0, length)

  // 2.删除解析过的字符并推进
  advanceBy(context, length)

  return content
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
