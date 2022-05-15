import { camelize, toHandlerKey } from '../shared'

export function emit(instance: any, event: any, ...args: any[]) {
  console.log('emit', event)
  // instance.props -> event
  const { props } = instance

  // TPP 开发技巧，先写一个特定的行为，在重构为通用行为
  // const handler = props['onAdd']
  // add -> onAdd
  // add-foo -> addFoo

  const handlerName = toHandlerKey(camelize(event))
  const handler = props[handlerName]
  handler && handler(...args)
}
