import { ref, h } from '../../lib/mini-vue.esm.js'

// 1.左侧对比
// (a b) c
// (a b) d e
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
// ]
// const nextChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'E' }, 'E'),
// ]

// 2.右侧对比
// a (b c)
// d e (b c)
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
// ]
// const nextChildren = [
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
// ]

// 3.新的比旧的长
//   创建新的
// 左侧
// (a b)
// (a b) c
// i = 2, e1 = 1, e2 = 2
// const prevChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]
// const nextChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'D' }, 'D'),
// ]

// 右侧
// (a b)
// c (a b)
// i = 2, e1 = -1, e2 = 0
// const prevChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]
// const nextChildren = [
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
// ]

// 4.旧的比新的长
//   删除老的
// 左侧
// (a b) c
// (a b)
// i = 2, e1 = 2, e2 = 1
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
// ]
// const nextChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]

// 右侧
// a (b c)
// (b c)
// i = 2, e1 = 0, e2 = -1
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
// ]
// const nextChildren = [h('p', { key: 'B' }, 'B'), h('p', { key: 'C' }, 'C')]

// 5.对比中间的部分
// 5.1.删除旧的（在旧的里面存在，新的里面不存在）
// a,b,(c,d)f,g
// a,b,(e,c)f,g
// d 节点在新节点中是没有的需要被删除
// c 节点 props 也发生了改变
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C', id: 'c-prev' }, 'C'),
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]
// const nextChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'C', id: 'c-next' }, 'C'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]

// 5.1.1 中间部分老的比新的对，那么多出来的直接就可以被删掉
// a,b,(c,e,d)f,g
// a,b,(e,c)f,g
// d 节点在新节点中是没有的需要被删除
// c 节点 props 也发生了改变
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C', id: 'c-prev' }, 'C'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]
// const nextChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'C', id: 'c-next' }, 'C'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]

// 5.2.移动（节点存在于新的和老的里面，但是位置变了）
// a,b,(c,d,e)f,g
// a,b,(e,c,d)f,g
// 最长递增子序列：[1,2]
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]
// const nextChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]

// 5.3 创建新的（在旧的里面不存在，新的里面存在）
// a,b,(c,e)f,g
// a,b,(e,c,d)f,g
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]
// const nextChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]

// 综合测试用例
// a,b,(c,d,e,z)f,g
// a,b,(d,c,y,e)f,g
// const prevChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'Z' }, 'Z'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]
// const nextChildren = [
//   h('p', { key: 'A' }, 'A'),
//   h('p', { key: 'B' }, 'B'),
//   h('p', { key: 'D' }, 'D'),
//   h('p', { key: 'C' }, 'C'),
//   h('p', { key: 'Y' }, 'Y'),
//   h('p', { key: 'E' }, 'E'),
//   h('p', { key: 'F' }, 'F'),
//   h('p', { key: 'G' }, 'G'),
// ]

// fix bug，C节点应该是被移动，而不是删除后再创建
const prevChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', {}, 'C'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'D' }, 'D'),
]
const nextChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', {}, 'C'),
  h('p', { key: 'D' }, 'D'),
]

export default {
  name: 'ArrayToArray',
  setup() {
    const isChange = ref(false)
    window.isChange = isChange // 挂载window上便于在控制台修改值

    return {
      isChange,
    }
  },
  render() {
    const self = this
    const children = self.isChange ? nextChildren : prevChildren
    return h('div', {}, children)
  },
}
