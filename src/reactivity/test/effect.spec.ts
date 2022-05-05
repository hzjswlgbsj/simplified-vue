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

  it('should return a runner when call effect', () => {
    // effect(fn) -> runner function -> fn -> return
    // 调用effect的时候会返回一个function称之为runner，调用runner后会把fn的返回值返回出去
    let foo = 10
    const runner = effect(() => {
      foo++
      return 'foo'
    })

    expect(foo).toBe(11)
    const res = runner() // 执行effect返回的runner函数并获得返回值
    expect(foo).toBe(12) // 查看是否重新执行过fn，如果执行了foo会加一
    expect(res).toBe('foo')
  })
})
