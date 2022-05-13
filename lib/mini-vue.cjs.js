'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    // initProps // 初始化props
    // initSlots // 初始化slots
    setupStatefulComponent(instance); // 初始化有状态的组件
}
function setupStatefulComponent(instance) {
    const Component = instance.type; // 拿到组件options
    const { setup } = Component;
    if (setup) {
        // 调用setup 得到xx ，可能是function和object
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
/**
 * 处理 component 定义中setup返回的值
 * @param setupResult Component的setup返回值
 */
function handleSetupResult(instance, setupResult) {
    // 如果是 function 的认为它就是组件的 render 函数，
    // 如果是 object 的话，会把object注入到组件上下文中
    // TODO function
    // object
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    // 保证render一定有值
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    // patch 派发更新
    patch(vnode);
}
function patch(vnode, container) {
    // TODO 判断VNode是不是element
    // 思考：如何区分是element还是component
    // processElement()
    // 处理组件
    processComponent(vnode);
}
function processComponent(vnode, container) {
    // 挂载组件
    // 判断是不是element
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    // setupComponent
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree);
}

function createApp(rootContainer) {
    return {
        mount(rootContainer) {
            // 先转化为 VNode，然后左右操作都基于 VNode 处理
            // component -> VNode
            const vnode = createVNode(rootContainer);
            render(vnode);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
