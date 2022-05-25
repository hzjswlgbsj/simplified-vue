## 简介

本项目的主要目标是实现一个简化版的 **Vue3** 用于学习 vue3 的架构设计，项目只会涉及最核心的流程代码，比如 reactivity 模块、runtime 模块和 compiler 模块，并不是一个可以用于生产环境的项目。

项目主要参考 《Vuejs 设计与实现》以及 [mini-vue](https://github.com/cuixiaorui/mini-vue)，代码中包含大量注释，只要涉及框架设计相关思想在 vue3 中有所涉及我都会详细注释在代码中，并且会一直更新代码中的注释。如果你想研究 vue3 源码又苦于代码复杂度太高不知道从何下手，你可以先看本仓库。

## 开发

如果想基于本仓库继续深入实现细节，或者想要记录一些自己的思考和想法，可以 fork 一份代码。

### 测试

测试依赖 [jest](https://jestjs.io/)，你需要安装，请注意你的 node 版本，根据提示正确配置。执行 `yarn test` 可以跑测试，如果你使用的是 vscode 建议安装 `Jest runner` 而不是 `Jest`，`Jest runner` 可以帮助你在 vscode 中更方便的进行断点调试。

### 打包

使用 [rollup](https://rollupjs.org) 来打包的项目源码，在 `package.json` 已经做好相关配置，直接执行 `yarn build` 就会在 `lib` 目录下输出 `mini-vue.cjs` 和 `mini.esm.js` 他们分别代表 commonjs 和 ES Module，当然你也可以修改 `rollup.config.js` 来增加其他类型的输出。

在测试 `example` 文件夹中有 index.html 文件，直接使用 `<script src="main.js" type="module"></script>` 的方式引用打包好后的 esm 文件。开发的时候你也可以执行 `yarn build --watch`，以开启实时编译。

## 最后

在我时间充足的情况下，会为每一个模块都系统性的写文章做说明，还会注释上《Vuejs 设计与实现》这本书对应章节的阅读笔记，Vue3 中的一些算法我也会提示对应的 LeetCode 相关题目或资料，敬请期待，如果觉得有收获可以帮忙点个 **start** 哦。

关于本人，github 主页也有相关介绍和博客地址，虽说许久未更新，但并不代表我没有产出哦，目前写的文章都在 _语雀_ 我会陆续搬运。写博客最重要的作用是知识的总结和吸收，其次才是传播，如有问题可以加我我们一起成长。

## 参考

1. [mini-vue](https://github.com/cuixiaorui/mini-vue)
2. [vue 技术内幕](http://caibaojian.com/vue-design/art)
3. [snabbdom](https://github.com/snabbdom/snabbdom/blob/master/README-zh_CN.md)
