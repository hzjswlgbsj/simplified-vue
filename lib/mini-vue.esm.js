function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children: children,
        el: null,
    };
    return vnode;
}

const isObject = (val) => {
    return val !== null && typeof val === 'object';
};

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
};
const PublicInstanceProxyHandle = {
    get({ _: instance }, key) {
        // 处理 setupState
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
    };
    return component;
}
/**
 * 初始化组件实例，准备组件必须的数据
 * @param instance 组件实例
 */
function setupComponent(instance) {
    // initProps // 初始化props
    // initSlots // 初始化slots
    setupStatefulComponent(instance); // 初始化有状态的组件
}
/**
 * 初始化组件中的各种状态
 * @param instance 组件实例
 */
function setupStatefulComponent(instance) {
    const Component = instance.type; // 拿到组件options
    // 代理对象，使得实例中可以直接通过this.xxx访问到setup中，$data。。。中的变量
    // 不需要再写this.data.xxxx -> this.xxx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandle);
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
/**
 * 保证组件实例中包含render函数
 * @param instance 组件实例
 */
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
function mountComponent(initialVNode, container) {
    // 首先创建一个组件实例
    const instance = createComponentInstance(initialVNode);
    // 然后去构建实例中必须的数据
    setupComponent(instance);
    // 递归渲染组件实例
    setupRenderEffect(instance, initialVNode, container);
}
function mountElement(vnode, container) {
    // 注意：这里的vnode是element类型
    // 创建element
    const el = (vnode.el = document.createElement(vnode.type));
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
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    // 这里所有的element都被mount了
    initialVNode.el = subTree.el;
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
