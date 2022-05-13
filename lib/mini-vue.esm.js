function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children: children,
    };
    return vnode;
}

const isObject = (val) => {
    return val !== null && typeof val === 'object';
};

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
    patch(vnode, container);
}
function patch(vnode, container) {
    // TODO 判断VNode是不是element
    // 思考：如何区分是element还是component
    if (typeof vnode.type === 'string') {
        // 处理element
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 处理组件
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    // element类型 也分为初始化和更新
    mountElement(vnode, container);
}
function processComponent(vnode, container) {
    // 挂载组件
    // 判断是不是element
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    // setupComponent
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function mountElement(vnode, container) {
    // 创建element
    const el = document.createElement(vnode.type);
    const { children, props } = vnode;
    // 处理children， children也分为 string和数组
    // 如果是string的话就直接是文本节点
    if (typeof vnode.children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(vnode.children)) {
        mountChildren(vnode, el);
    }
    // 处理元素的属性 props
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }
    container.appendChild(el);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转化为 VNode，然后左右操作都基于 VNode 处理
            // component -> VNode
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
