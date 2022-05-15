import { h, renderSlots } from '../../lib/mini-vue.esm.js'

export const Foo = {
  setup() {
    return {}
  },
  render() {
    const foo = h('p', {}, 'foo')

    // children -> vnode
    // renderSlots
    // 具名插槽
    // 1.获取到渲染的元素，放到vnode的children中
    // 2.通过传name实现具名插槽

    // 作用域插槽：将子组件的变量（在子组件作用域）可以在使用他的父组件（父组件作用域）
    // 中传递给子组件的插槽（插槽现在在父组件作用域中）
    const age = 18
    return h('div', {}, [
      renderSlots(this.$slots, 'header', { age }),
      foo,
      renderSlots(this.$slots, 'footer', { age }),
    ])
  },
}
