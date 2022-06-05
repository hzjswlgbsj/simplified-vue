// parse 主要是用于将 template 选项中的模板代码字符串转化为 ast

import { NodeTypes } from './ast'

export const enum TagType {
  Start,
  End,
}

/**
 * 解析模板代码字符串为 ast
 * 我画了一下整个解析过程的有限状态机的简单示意图：
 * https://www.processon.com/view/link/629c5ce81efad4162c7d2420
 * 有限状态机与正则表达式使用密切，这里实现的比较简单，解析的规则定的也比较
 * 简单，下面我附上了 vue3 中解析 HTML 的规则，有兴趣的可以深入了解
 * https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
 * https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
 * https://html.spec.whatwg.org/multipage/parsing.html#end-tag-open-state
 * https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element
 * @param content 初始解析的模板代码字符串
 * @returns ast
 */
export function baseParse(content: string) {
  const context = createParseContext(content)

  return createRoot(parseChildren(context, []))
}

function parseChildren(context: any, ancestors: any[]) {
  const nodes = []

  while (!isEnd(context, ancestors)) {
    let node
    const s = context.source

    if (s.startsWith('{{')) {
      // 普通的插值类型
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      // element 类型
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }

    // 如果 node 没有值说明不是插值或者 element 认为是一个普通字符串
    if (!node) {
      node = parseText(context)
    }
    nodes.push(node)
  }

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

function parseElement(context: any, ancestors: any[]) {
  const element: any = parseTag(context, TagType.Start) // 解析出tag，并删除标签左边部分（<div>），并推进
  ancestors.push(element) // 收集祖先元素
  element.children = parseChildren(context, ancestors)
  ancestors.pop() // 递归解析完后代后应该弹出自己

  // 当前结束标签和开始标签一样，那就消费这个tag
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End) // 删除标签右边部分（</div>），并推进
  } else {
    // 如果不相等，说明缺少结束标签
    throw new Error(`缺少结束标签：${element.tag}`)
  }
  return element
}

function startsWithEndTagOpen(source: any, tag: string) {
  return (
    source.startsWith('</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  )
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

/**
 * 解析纯文本需要从文本中剔除插值，需要以“{{”和“}}”来判断解析位置
 * @param context 记录解析信息上下文
 * @returns
 */
function parseText(context: any) {
  let endIndex = context.source.length
  // 如果遇到“{{” 就认为是插值开始了，但是实际情况还要更复杂
  // 用户可能就值输入了 “{{” 没有输入 “}}”，还有可能嵌套其他
  // 标签，导致下面的endToken应该是个数组
  let endTokens = ['<', '{{']

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    // 如果能找到 endTokens 的话就可以更新 endIndex 了
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  // 获取内容，并删除和推进
  const content = parseTextData(context, endIndex)

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

/**
 * 判断编译的字符是否结束，要特别注意用户可能没有写结束标签
 * 需要判断出来这种情况，否则在编译的时候将出现死循环，怎么破？
 * Dom 是嵌套的，我们在解析标签的时候，应该每次把之前解析过的
 * tag 用一个栈保存下来，如果有上一个标签被闭合了，说明当前处理
 * 的标签没有被闭合，用户写了一个错误的标签，直接将其忽视并作为
 * 纯字符串处理
 * @param context
 * @param ancestors 祖先tags
 * @returns string | undefined
 */
function isEnd(context: any, ancestors: any[]) {
  // 当遇到结束标签的时候
  const s = context.source

  // 如果当前解析的字符串是某个标签的结束标签，那需要与祖先tag对比
  if (s.startsWith('</')) {
    // 如果用户写的模板没有错误，那当前处理的元素更靠近栈顶，从栈顶开始往栈底找的话会比较快
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag
      // </div> 解析出当前的tag，并判断是否与某个祖先tag命中
      if (startsWithEndTagOpen(s, tag)) {
        return true
      }
    }
  }

  // 当source还有值的时候
  return !context.source
}

function createParseContext(content: string) {
  return {
    source: content,
  }
}

function createRoot(children: any[]) {
  return {
    children,
    type: NodeTypes.ROOT,
  }
}
