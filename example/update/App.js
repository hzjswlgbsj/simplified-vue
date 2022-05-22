// ------------------ 测试视图响应式--------------------
// 视图的更新实际上是对比更新钱的vnode和更新后的vnode
// 响应式数据改变后应该生成两个vnode
import { h, ref } from '../../lib/mini-vue.esm.js'

export default {
  name: 'App',
  setup() {
    const count = ref(0)
    const onClick = () => {
      count.value++
    }
    const props = ref({
      foo: 'foo',
      bar: 'bar',
    })
    const onChangePropsDemo1 = () => {
      props.value.foo = 'new-foo'
    }
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined
    }
    const onChangePropsDemo3 = () => {
      props.value = {
        foo: 'foo',
      }
    }
    return {
      count,
      onClick,
      props,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    }
  },
  render() {
    return h(
      'div',
      {
        id: 'root',
        ...this.props,
      },
      [
        h('div', {}, `count: ${this.count}`), // 依赖收集
        h(
          'button',
          {
            onClick: this.onClick,
          },
          'click'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo1,
          },
          'changeProps - 值变了 - 修改'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo2,
          },
          'changeProps - 值变成了 undefined - 删除'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo3,
          },
          'changeProps - 删除了值中的一个属性 - 删除'
        ),
      ]
    )
  },
}
