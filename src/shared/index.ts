export const extend = Object.assign
export const isObject = (val: any) => {
  return val !== null && typeof val === 'object'
}

export const isOn = (key: string) => /^on[A-Z]/.test(key)
export const hasOwn = (val: any, key: string) =>
  Object.prototype.hasOwnProperty.call(val, key)
export const hasChanged = (val: any, newVal: any) => {
  return !Object.is(val, newVal)
}
