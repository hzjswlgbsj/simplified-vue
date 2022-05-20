const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children: children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // children
    if (typeof children === 'string') {
        // 合并vnode节点类型和children类型，相当于同时判断了节点类型也判断了children类型
        vnode.shapeFlag = vnode.shapeFlag | 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | 8 /* ARRAY_CHILDREN */;
    }
    // 判断是否是slots children， 他应该是组件类型，并且children是一个object
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag = vnode.shapeFlag | 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            // children 中是不可以有 array的，所以这里用一个div包裹
            // 如何解决？其实我们只需要把children里面的所有节点渲染出来就行
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isOn = (key) => /^on[A-Z]/.test(key);
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toLocaleUpperCase() : '';
    });
};
const capitalize = (str) => {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

const targetMap = new Map();
/**
 * 触发dep中的一系列副作用
 * @param dep 保存的effect集合
 */
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
/**
 * 基于target 和 key 去取到对应的dep，并执行其中的fn
 * @param target 目标对象
 * @param key 目标对象的key值
 */
function trigger(target, key) {
    let depsMap = targetMap.get(target); // 先取到目标对象的deps的集合
    if (depsMap) {
        let dep = depsMap.get(key);
        triggerEffects(dep);
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShallowReadonly = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLI */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 如果是isShallowReadonly
        if (isShallowReadonly) {
            return res;
        }
        // 如果 res 依然是 引用类型的话，我们需要让它也是响应式的
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // TODO 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} setting failed because target is read-only`, target, value);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} Must be an object`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

function emit(instance, event, ...args) {
    console.log('emit', event);
    // instance.props -> event
    const { props } = instance;
    // TPP 开发技巧，先写一个特定的行为，在重构为通用行为
    // const handler = props['onAdd']
    // add -> onAdd
    // add-foo -> addFoo
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    // attrs
}

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
    $slots: (instance) => instance.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            // 处理 setupState 返回值
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            // 处理 props 返回值
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    // 必须要是slot才做相应处理
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    // children 是具名插槽对象
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
/**
 * 初始化组件实例，准备组件必须的数据
 * @param instance 组件实例
 */
function setupComponent(instance) {
    // 初始化props
    initProps(instance, instance.vnode.props);
    // 初始化slots
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance); // 初始化有状态的组件
}
/**
 * 初始化组件中的各种状态
 * @param instance 组件实例
 */
function setupStatefulComponent(instance) {
    const Component = instance.type; // 拿到组件options
    // 代理对象，使得实例中可以直接通过this.xxx访问到setup中，$data。。。中的变量
    // 不需要再写this.data.xxxx -> this.xxxx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        // 调用setup 得到vue3的setup执行后返回的状态对象 ，可能是function和object
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
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
/**
 * 获取当前组件实例
 */
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // 如何保存 provide 的值？
    // 这里保存的值需要利用到原型链，provide/inject是穿透性的
    // 中途的任何一个组件都有可能provide 相同的key，我们需要
    // 想原型链那样一层一层的访问
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 当前组件实例中的provides的原型需要执行父亲节点的provides
        // 但是这个动作只能执行一次，初始化的时候，不然每次都会被覆盖
        // 如何区分是不是第一次初始化呢？
        // 1.我们在创建组件实例的时候 provides 的初始值被赋值为父亲
        // 的provides，所以当前的provides肯定 等于 父亲的provides
        // 2.如果provide方法被调用后当前的provides肯定 不等于 父亲的provides
        // 这里能直接判断对象是因为引用地址变了
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 获取，是从父亲组件的provides里面拿
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先转化为 VNode，然后左右操作都基于 VNode 处理
                // component -> VNode
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, } = options;
    function render(vnode, container) {
        // patch 派发更新
        patch(vnode, container, null);
    }
    function patch(vnode, container, parentComponent) {
        const { shapeFlag, type } = vnode; // 拿到状态flag
        // Fragment -> 只渲染 children ，不增加一个div包裹
        switch (type) {
            case Fragment:
                processFragment(vnode, container, parentComponent);
                break;
            case Text:
                processText(vnode, container);
                break;
            default:
                // 判断vnode是不是element
                if (shapeFlag & 1 /* ELEMENT */) {
                    // 处理element
                    processElement(vnode, container, parentComponent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(vnode, container, parentComponent);
                }
                break;
        }
    }
    function processText(vnode, container) {
        // Text 类型
        const { children } = vnode;
        const textNode = (vnode.el = document.createTextNode(children));
        container.appendChild(textNode);
    }
    function processFragment(vnode, container, parentComponent) {
        // fragment 类型
        mountChildren(vnode, container, parentComponent);
    }
    function processElement(vnode, container, parentComponent) {
        // element类型 也分为初始化和更新
        mountElement(vnode, container, parentComponent);
    }
    function processComponent(vnode, container, parentComponent) {
        // 挂载组件
        mountComponent(vnode, container, parentComponent);
    }
    function mountComponent(initialVNode, container, parentComponent) {
        // 首先创建一个组件实例
        const instance = createComponentInstance(initialVNode, parentComponent);
        // 然后去构建实例中必须的数据
        setupComponent(instance);
        // 递归渲染组件实例
        setupRenderEffect(instance, initialVNode, container);
    }
    function mountElement(vnode, container, parentComponent) {
        // 注意：这里的vnode是element类型
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, props, shapeFlag } = vnode;
        // 处理children， children也分为 string和数组
        // 如果是string的话就直接是文本节点
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            // 如果是数组的话挂载children
            mountChildren(vnode, el, parentComponent);
        }
        // 处理元素的属性 props
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, val);
        }
        hostInsert(el, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        // vnode -> patch
        // vnode -> element -> mountElement
        patch(subTree, container, instance);
        // 这里所有的element都被mount了
        initialVNode.el = subTree.el;
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((v) => {
            patch(v, container, parentComponent);
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    // 处理事件注册
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, parent) {
    parent.appendChild(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createElement, createRenderer, createTextVNode, getCurrentInstance, h, inject, insert, patchProp, provide, renderSlots };
