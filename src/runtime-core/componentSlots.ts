import { ShapeFlags } from '../shared/shapeFlags'

export function initSlots(instance: any, children: any) {
  // 必须要是slot才做相应处理
  const { vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }
}

export function normalizeObjectSlots(children: any, slots: any) {
  // children 是具名插槽对象
  for (const key in children) {
    const value = children[key]
    slots[key] = (props: any) => normalizeSlotValue(value(props))
  }
}

export function normalizeSlotValue(value: any) {
  return Array.isArray(value) ? value : [value]
}
