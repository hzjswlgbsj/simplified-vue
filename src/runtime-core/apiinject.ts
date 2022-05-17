import { getCurrentInstance } from './component'

export function provide(key: string, value: any) {
  // 如何保存 provide 的值？可以保存在实例上
  const currentInstance = getCurrentInstance()

  if (currentInstance) {
  }
}

export function inject() {}
