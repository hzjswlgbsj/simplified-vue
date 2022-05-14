export const enum PatchFlags {
  // 动态文本节点
  TEXT = 1,
  // 2 动态class
  CLASS = 1 << 1,
  // 4 动态style
  STYLE = 1 << 2,
  // 8 动态属性，但不好汉class style
  PROPS = 1 << 3,
  // 16 具有动态key属性，当key改变时，需要进行完整的diff
  FULL_PROPS = 1 << 4,
  // 32 带有监听事件的节点
  HYDRATE_EVENTS = 1 << 5,
  // 64 一个不会改变子节点顺序的fragment
  STABLE_FRAGMENT = 1 << 6,
  // 128 带有key的fragment
  KEYED_FRAGMENT = 1 << 7,
  // 256 没有key的fragment
  UNKEYED_FRAGMENT = 1 << 8,
  // 512 一个子节点只会进行非props比较
  NEED_PATCH = 1 << 9,
  // 1024 动态插槽
  DYNAMIC_SLOTS = 1 << 10,
  // 下面是特殊的,即在diff阶段会被跳过的
  // 2048 表示仅因为用户在模板的根级别放置注释而创建的片段，这是一个仅用于开发的标志，因为注释在生产中被剥离
  DEV_ROOT_FRAGMENT = 1 << 11,
  // 静态节点，它的内容永远不会改变，不需要进行diff
  HOISTED = -1,
  // 用来表示一个节点的diff应该结束
  BAIL = -2,
}
