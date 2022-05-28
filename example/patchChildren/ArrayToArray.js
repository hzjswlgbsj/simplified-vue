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
const prevChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
]
const nextChildren = [
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
]

// 3.新的比旧的长
//   创建新的
// 左侧
// (a b)
// (a b) c
// i = 2, e1 = 1, e2 = 2
// const prevChildren = [
//   h('p', {key: 'A'}, 'A'),
//   h('p', {key: 'B'}, 'B'),
// ]
// const nextChildren = [
//   h('p', {key: 'A'}, 'A'),
//   h('p', {key: 'B'}, 'B'),
//   h('p', {key: 'C'}, 'C'),
// ]

// 右侧
// (a b)
// c (a b)
// i = 2, e1 = -1, e2 = 0
// const prevChildren = [
//   h('p', {key: 'A'}, 'A'),
//   h('p', {key: 'B'}, 'B'),
// ]
// const nextChildren = [
//   h('p', {key: 'C'}, 'C'),
//   h('p', {key: 'A'}, 'A'),
//   h('p', {key: 'B'}, 'B'),
// ]

// 4.旧=的比新的长
//   删除老的
// 左侧
// (a b) c
// (a b)
// i = 2, e1 = 2, e2 = 1
// const prevChildren = [
//   h('p', {key: 'A'}, 'A'),
//   h('p', {key: 'B'}, 'B'),
//   h('p', {key: 'C'}, 'C'),
// ]
// const nextChildren = [
//   h('p', {key: 'A'}, 'A'),
//   h('p', {key: 'B'}, 'B'),
// ]

// 右侧
// a (b c)
// (b c)
// i = 2, e1 = 0, e2 = -1
// const prevChildren = [
//   h('p', {key: 'A'}, 'A'),
//   h('p', {key: 'B'}, 'B'),
//   h('p', {key: 'C'}, 'C'),
// ]
// const nextChildren = [
//   h('p', {key: 'B'}, 'B'),
//   h('p', {key: 'C'}, 'C'),
// ]

// 5.对比中间的部分
// 1.创建新的（在旧的里面不存在，新的里面存在）
// 2.删除旧的（在旧的里面存在，新的里面不存在）
// 3.移动（节点存在于新的和老的里面，但是位置变了）
//   - 使用最长子序列类优化

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
