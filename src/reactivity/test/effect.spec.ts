import { reactive } from '../reactive'
import { effect } from '../effect'

describe('effect', () => {
  it('happy path', () => {
    // 使用 reactive 将数据变成响应式
    const user = reactive({
      age: 10,
    })

    let nextAge

    // 使用 effect 来收集依赖副作用
    effect(() => {
      nextAge = user.age + 1
    })

    expect(nextAge).toBe(11)

    // 触发更新
    user.age++
    expect(nextAge).toBe(12)
  })
})
