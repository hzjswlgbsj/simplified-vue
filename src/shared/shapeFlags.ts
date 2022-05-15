// ShapeFlags 可以理解为是很多种状态的集合，如果不统一管理的话
// 代码里面就会有很多 isXXX，用于判断某个程序分支，这里的 ShapeFlags
// 用于区分 vnode 的个汇总类型和状态

// 用枚举 + 位运算表示
export const enum ShapeFlags {
  ELEMENT = 1, // 00001
  STATEFUL_COMPONENT = 1 << 1, // 00010，由0001的值1左移1位得到
  TEXT_CHILDREN = 1 << 2, // 00100，由0001的值1左移2位得到
  ARRAY_CHILDREN = 1 << 3, // 01000，由0001的值1左移3位得到
  SLOT_CHILDREN = 1 << 4, // 10000，由0001的值1左移4位得到
}

// 用对象来实现的话可读性好但是性能不行
// const ShapeFlags = {
//   element: 0,
//   stateful_component: 0,
//   text_children: 0,
//   array_children: 0,
// }

// 1.可以设置、修改
// ShapeFlags.stateful_component = 1 // 表示vnode是一个stateful_component
// ShapeFlags.array_children = 1 // 表示vnode的children是一个数组
// ShapeFlags.element = 1 // 表示vnode是一个element
// ShapeFlags.text_children = 1 // 表示vnode的children是一个文本节点

// 2.可以查找判断
// if (ShapeFlags.element) // 像这样直接用于判断组件是否是element类型

// ---------------- 复习一下位运算 ------------------
// 0000 // 4个状态我们可以用4位来分别表示4中状态
// 0001 -> element
// 0010 -> stateful_component
// 0100 -> text_children
// 1000 -> array_children

// 还能组合使用
// 1010 -> array_children && stateful_component

// 如何运算？通过 或（|）和（&）与操作符
// | （0 | 0 = 0）
// & （1 & 1 = 1）

// 通过 | 来做修改操作
// 0000 | 0001 -> 0001 // 设置最后一位为1（将表示为element类型）

// 通过 &查找（判断） 来做操作
// 0001 & 0001 -> 0001 // 判断最后一位是不是1（是否是element类型）
