const queue: any[] = []
let isFlushPending = false
const p = Promise.resolve()

// 在vue2.5之前版本的源码中 vue 异步更新视图开启的异步方式有很多种
// 是微任务和宏任务混合使用了，但是这种方式会产生很多问题（请参照vue2.5源码注释）
// https://github.com/vuejs/vue/blob/main/src/core/util/next-tick.ts
// 在2.5版本后全部采用的了微任务，这里我们直接使用 Promise ，没有考虑平台兼容问题
export function nextTick(fn: () => void) {
  // 这里不需要多个 promise ，所以全局定义了一个resolve的promise
  return fn ? p.then(fn) : p
}

export function queueJobs(job: any) {
  if (!queue.includes(job)) {
    queue.push(job)
  }

  queueFlush()
}

function queueFlush() {
  if (isFlushPending) return
  isFlushPending = true
  nextTick(flushJob)
}

export function flushJob() {
  isFlushPending = false
  let job
  while ((job = queue.shift())) {
    job && job()
  }
}
