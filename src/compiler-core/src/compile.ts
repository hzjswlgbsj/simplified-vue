// -----------------------------这里是 compiler 的出口文件-----------------------------------
// 这里提供一下 vue3 各个核心模块之间的组织方式，下面是 vue3 模块之间的依赖关系
// https://www.processon.com/view/link/629e0c1f1e08530e56bd1800
// compiler 模块不要引用 runtime 的代码，反之亦然，原因在上图一并画出来了

import { generate } from './codegen'
import { baseParse } from './parse'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformExpression } from './transforms/transformExpression'
import { transformText } from './transforms/transformText'
const TAG = 'src/compiler-core/src/compile'

export function baseCompile(template: string) {
  console.log(TAG, 'baseCompile->开始执行编译：', template)

  const ast = baseParse(template)
  console.log(TAG, 'baseCompile->编译后获得ast：', ast)

  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  })

  console.log(TAG, 'baseCompile->获得修剪后的ast：', ast)
  const code = generate(ast)
  console.log(TAG, 'baseCompile->获得编译后的code：', code)
  return code
}
