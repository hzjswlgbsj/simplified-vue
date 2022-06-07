// mini-vue 出口
export * from './runtime-dom'
export * from './reactivity'
import { baseCompile } from './compiler-core/src'
import * as runtimeDom from './runtime-dom'
import { registerRuntimeCompiler } from './runtime-dom'
const TAG = '/src/index'
/**
 * baseCompile 返回值不是render函数，这里要生成这个render 函数
 * @param template
 */
function comileToFunction(template: string) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDom)
  console.log(TAG, 'comileToFunction->编译结束获得render函数：', render)
  return render
}

registerRuntimeCompiler(comileToFunction)
