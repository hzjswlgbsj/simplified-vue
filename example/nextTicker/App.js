import { h, ref, getCurrentInstance, nextTick } from '../../lib/mini-vue.esm.js'

export default {
  name: 'App',
  setup() {
    const count = ref(1)
    const instance = getCurrentInstance()

    function onClick() {
      for (let i = 0; i < 100; i++) {
        count.value = i
      }

      console.log('instance中的el是更新之前', instance.vnode.el.innerText) // 这里的instance中的el是更新之前的
      nextTick(() => {
        console.log('instance中的el是更新之后', instance.vnode.el.innerText) // 这里的instance中的el是更新之后的
      })
    }
    return {
      onClick,
      count,
    }
  },
  render() {
    const button = h('button', { onClick: this.onClick }, 'update')
    const p = h('p', {}, `count: ${this.count}`)
    return h('div', {}, [button, p])
  },
}
