export * from './toDisplayString'
export const EMPTY_OBJ = {}
export const extend = Object.assign
export const isObject = (val: any) => {
  return val !== null && typeof val === 'object'
}
export const isString = (val: any) => typeof val === 'string'

export const isOn = (key: string) => /^on[A-Z]/.test(key)
export const hasOwn = (val: any, key: string) =>
  Object.prototype.hasOwnProperty.call(val, key)
export const hasChanged = (val: any, newVal: any) => {
  return !Object.is(val, newVal)
}

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toLocaleUpperCase() : ''
  })
}

export const capitalize = (str: string) => {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1)
}

export const toHandlerKey = (str: string) => {
  return str ? 'on' + capitalize(str) : ''
}
