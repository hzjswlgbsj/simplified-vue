'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children: children,
        component: null,
        key: props && props.key,
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

function toDisplayString(value) {
    return String(value);
}

const EMPTY_OBJ = {};
const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isString = (val) => typeof val === 'string';
const isOn = (key) => /^on[A-Z]/.test(key);
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
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

let activeEffect; // 保存当前正在被触发处理的副作用实例，执行run的时候被激活保存
const targetMap = new Map();
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler = null) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        activeEffect = this;
        shouldTrack = true;
        const result = this._fn();
        shouldTrack = false; // reset
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
/**
 * 将activeEffect收集到dep中
 * @param dep 收集effect是容器是个Set结构
 */
function trackEffects(dep) {
    // 如果当前的effect已经在dep中了就不需要再添加了
    if (dep.has(activeEffect)) {
        return;
    }
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
/**
 * 从dep中删除不需要跟踪的副作用
 * @param effect ReactiveEffect 实例
 */
function cleanupEffect(effect) {
    const { deps } = effect;
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0;
    }
}
function isTracking() {
    return shouldTrack && typeof activeEffect !== 'undefined';
}
/**
 * 收集依赖
 * 1.我们需要一个容器（Dep）来收集依赖副作用（activeEffect）
 * 2.因为这个依赖是不重复的所以使用 Set 数据结构
 * 完整的 deps 保存的数据结构我画了图可以参考：https://www.processon.com/view/link/629db369e0b34d46d73bc3a6
 * @param target 目标对象
 * @param key 目标对象的key值
 */
function track(target, key) {
    // Q: dep 我们应该存在哪里呢？
    // A: 首先数据流映射关系是 target ->（依对应） key ->（对应） dep，所以我们需要 Map 数据结构
    //    又因为这个track函数依赖过程是复用且频繁的，我们不需要重复申请Map结构，所以我们定义再函数外targetMap
    if (!isTracking()) {
        return;
    }
    let depsMap = targetMap.get(target); // 通过target获取到deps
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep); // 将activeEffect收集到dep中
}
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
function effect(fn, options) {
    if (!options) {
        options = {};
    }
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // options 会有很多我们直接 assign
    // _effect.onStop = options.onStop
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
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
        if (!isReadonly) {
            // 依赖收集
            track(target, key);
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

// reactivity 我画了一个简图可以参考：https://www.processon.com/view/link/629db3295653bb03f2ca9bb4
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

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value; // 保存一个没有处理过的value
        // Ref 也要支持对象，这边得分开处理
        // 对象类型的处理我们已经有reactive 可以用了
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 如果值没有改变则不处理
        if (hasChanged(this._rawValue, newValue)) {
            // 一定是先修改了value值再去做trigger
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep); // 触发副作用
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep); // 依赖收集
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
/**
 * 实现Ref与普通对象取值无差异化
 * @param ref RefImpl对象或者普通对象
 * @returns
 */
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
/**
 * 代理ref取值，使得ref对象不需要每次访问属性都需要「.value」
 * @param raw 被代理对象
 */
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // get -> age(ref) 就返回.value
            // get -> age(not ref) 就返回 age
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
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
    $props: (instance) => instance.props,
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

const TAG$1 = 'runtime-core/component';
let currentInstance = null;
let compiler;
/**
 * 根据vnode来生成一个组件实例
 * @param vnode 虚拟节点
 * @param parent 父节点
 * @returns 组件实例
 */
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        emit: () => { },
        isMounted: false,
        subTree: {},
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
        console.log(TAG$1, 'setupStatefulComponent->初始化组件结束', instance);
    }
}
/**
 * 处理 component 定义中setup返回的值
 * @param setupResult Component的setup返回值
 */
function handleSetupResult(instance, setupResult) {
    // 如果是 function 的话认为它就是组件的 render 函数，
    // 如果是 object 的话，会把object注入到组件上下文中
    // TODO function
    // object，使用proxyRefs代理，使得在使用setup返回变量的时候不需要手动添加.value
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
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
    // 如果没有render函数则用template生成render函数
    if (compiler && !Component.render) {
        Component.render = compiler(Component.template);
    }
    instance.render = Component.render;
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
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

/**
 * 对比两个虚拟节点的props对象，返回是否需要触发更新
 * @param n1 旧的组件节点
 * @param n2 新的组件节点
 */
function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

/**
 * 在createApp 外层再包装一层使得创建一个App实例更灵活
 * @param render 外部替自己提供的render函数
 * @returns
 */
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

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
// 在vue2.5之前版本的源码中 vue 异步更新视图开启的异步方式有很多种
// 是微任务和宏任务混合使用了，但是这种方式会产生很多问题（请参照vue2.5源码注释）
// https://github.com/vuejs/vue/blob/main/src/core/util/next-tick.ts
// 在2.5版本后全部采用的了微任务，这里我们直接使用 Promise ，没有考虑平台兼容问题
function nextTick(fn) {
    // 这里不需要多个 promise ，所以全局定义了一个resolve的promise
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJob);
}
function flushJob() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

//---------------------------createRenderer-------------------------------
const TAG = 'src/runtime-core/renderer';
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // patch 派发更新
        patch(null, vnode, container, null, null);
    }
    /**
     * 根据虚拟节点类型触发对应的视图更新
     * @param n1 旧（上一次）的 vnode
     * @param n2 新（本次）的 vnode
     * @param container 根容器dom
     * @param parentComponent 父组件
     */
    function patch(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag, type } = n2; // 拿到状态flag
        // Fragment -> 只渲染 children ，不增加一个div包裹
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 判断vnode是不是element
                if (shapeFlag & 1 /* ELEMENT */) {
                    // 处理element
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        // Text 类型
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.appendChild(textNode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        // fragment 类型
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 旧节点不存在说明是初始化，那就初始化挂载
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            // 更新
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        // 没有老节点代表是初始化渲染
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor); // 挂载组件
        }
        else {
            updateComponent(n1, n2); // 更新组件
        }
    }
    /**
     * 挂载组件类型的vnode
     * @param initialVNode 初始化的虚拟节点
     * @param container 根容器
     * @param parentComponent 父节点
     */
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 首先创建一个组件实例，并将实例保存到VNode上
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        // 然后去构建实例中必须的数据
        setupComponent(instance);
        // 递归渲染组件实例
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    /**
     * 更新组件类型的vnode
     * 更新组件无非就是调用当前组件的render函数生成新的VNode，再进行patch
     * @param n1 旧的组件节点
     * @param n2 新的组件节点
     */
    function updateComponent(n1, n2) {
        // 从旧组件VNode中拿到老的实例并赋值给新组件VNode的实例以便于下次更新能找到正确的实例
        const instance = (n2.component = n1.component);
        // 判断是否需要触发更新
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2; // 保存新的VNode到实例
            instance.update();
        }
        else {
            n2.el = n1.el; // 不需要更新的话将新的节点的el直接赋值为旧的
            instance.vnode = n2; // 更新当前实例上挂的vnode为新的
        }
    }
    /**
     * 处理 dom 类型的节点，这里封装了一套接口，dom 的方法我们抽到runtime-dom中，这里是调用外部
     * 创建自定义渲染器传进来的一套api：hostCreateElement,hostPatchProp, hostInsert...
     * 注意：初始化流程的时候才会执行全量挂载，如果是更新操作的话会执行patchElement去直接更新需要跟新的节点
     * @param vnode 虚拟节点
     * @param container 根容器
     * @param parentComponent 父节点
     */
    function mountElement(vnode, container, parentComponent, anchor) {
        console.log(TAG, 'mountElement->开始执行DOM元素类型的的初始化挂载', vnode);
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
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // 处理元素的属性 props
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    /**
     * 根据新旧虚拟节点来更新 element 的视图，这个过程比较复杂，这里会拆分问题:
     * 更新props、
     * @param n1 更新前的vnode
     * @param n2 本次要更新的vnode
     * @param container 根容器
     * @param parentComponent 父组件
     */
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log(TAG, 'patchElement', '开始执行DOM元素类型的更新操作', n1, n2);
        /* 更新 props */
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 想想 el 在哪里赋值的？在 mountElement 的时候不仅创建了el还将它赋值到了vnode上
        // 同理 我们这里需要将更新前的el赋值给更新后的vnode上，确保下一次的更新 vnode上有el
        const el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps);
        /* 更新 children */
        patchChildren(n1, n2, el, parentComponent, anchor);
    }
    /**
     * 对比更新新旧 props
     * 更新 props 主要有三种场景
     * 1.之前的值和现在的值不一样了【修改操作】
     * 2.值或者属性变成 null 或者 undefined【删除操作】
     * 3.props 对象中的某个属性被删除【删除操作】
     * @param el 第一次初始化的时候创建的el，在mountElement方法中被赋值并保存到vnode中
     * @param oldProps 旧的 props
     * @param newProps 新的 props
     */
    function patchProps(el, oldProps, newProps) {
        console.log(TAG, 'patchProps', '开始执行DOM元素类型的更新操作-处理属性', el, oldProps, newProps);
        if (oldProps !== newProps) {
            // 遍历新的props 修改需要修改的，如果有属性变成undefined或者null那么删除
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                // 更新
                if (prevProp !== nextProp) {
                    // 使用接口中用户提供的props处理函数完成更新
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                // 遍历旧的props，检查在新的props中是否存在
                for (const key in oldProps) {
                    // 如果不存在就删除
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    /**
     * 根据新老虚拟节点更新 children
     * 这里我们需要对比新老节点的情况，一共有4中情况
     * case1： 老的节点是 array 新的节点是 text
     * case2： 老的节点是 text 新的节点是 text
     * case3： 老的节点是 text 新的节点是 array
     * case4： 老的节点是 array 新的节点是 array
     * @param n1 旧（上一次）的 vnode
     * @param n2 新（本次）的 vnode
     * @param container 父级容器element节点
     * @param parentComponent 父组件
     */
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const nextShapeFlag = n2.shapeFlag;
        const c1 = n1.children;
        const c2 = n2.children;
        // 注意：case1 和 case2 两种情况代码可以合并，但是为了可读性好并没有采用，合并的代码注释在下面了
        // case1：如果新的节点是一个文本节点，并且老的节点是一个 array
        if (nextShapeFlag & 4 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 1.将原来的 children 完全清空
                unmountChildren(n1.children);
                // 2.在其位置上插入新的文本节点
                hostSetElementText(container, c2);
            }
        }
        // case2：如果新的节点是一个文本节点，并且老的节点也是一个文本节点
        if (nextShapeFlag & 4 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 直接替换即可
                hostSetElementText(container, c2);
            }
        }
        // case3：如果新的节点是一个array节点，老的节点是一个文本节点
        if (nextShapeFlag & 8 /* ARRAY_CHILDREN */) {
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 1.将原来的 text 完全清空
                hostSetElementText(container, '');
                // 2.挂载 children
                mountChildren(n2.children, container, parentComponent, anchor);
            }
        }
        // case4：如果新的节点是一个array节点，老的节点也是一个array
        // 这种情况比较复杂了，需要diff array
        if (nextShapeFlag & 8 /* ARRAY_CHILDREN */) {
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor); // diff
            }
        }
        /* 合并后的代码 */
        // if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        //   if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //     unmountChildren(n1.children)
        //   }
        //   if (n1.children !== n2.children) {
        //     hostSetElementText(container, newChildren)
        //   }
        // } else {
        //   if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        //     hostSetElementText(container, '')
        //     mountChildren(n2.children, container, parentComponent)
        //   }
        // }
    }
    /**
     * 为新旧两个节点的 children 都是 array 的情况下做 diff 算法
     * 以此来节约重复创建 DOM 所带来的性能消耗，diff的思想是：
     * 找到新旧节点左右相同的节点，收敛出中间一个变化的区间，在收敛左右的
     * 时候，如果发现新旧节点的增减节点直接进行增删，最后得到新旧节点两个
     * 收敛区间，收敛区间再去检测是否有可复用的节点，因为用户可能仅仅是交换的节点位置
     *
     * 首先定义三个指针：
     * let i = 0 // 左侧第一个不同的指针下标
     * let e1 = c1.length - 1 // 旧节点右侧（从右往左）第一个不同的指针下标
     * let e2 = c2.length - 1 // 新节点右侧（从右往左）第一个不同的指针下标
     * 1.从左侧开始向右侧遍历直到找到新旧节点左侧第一个不同的指针下标得到一个i
     * 2.从最右侧向左侧遍历直到找到新旧节点第一个不同的指针下标，得到e1, e2
     * 3.新的比旧的长，创建新节点多出来的节点
     * 4.旧的比新的长，删除老节点多出来的节点
     * 5.中间对比
     *   5.1 删除旧的（在旧的里面存在，新的里面不存在）
     *   5.2 移动（节点存在于新的和老的里面，但是位置变了）
     *   5.3 创建新的（在旧的里面不存在，新的里面存在）
     * @param c1 旧节点的children
     * @param c2 新节点的children
     * @param container 父级容器element节点
     * @param parentComponent 父组件
     */
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0; // 新旧节点左侧第一个不同的指针下标
        let e1 = c1.length - 1; // 旧节点右侧（从右往左）第一个不同的指针下标
        let e2 = c2.length - 1; // 新节点右侧（从右往左）第一个不同的指针下标
        function isSameVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 1.左侧对比
        // 先遍历两个children 直到左侧的不同之处开始的下标
        // 如果是相同的那就直接patch
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 2.右侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 3.新的比旧的长，创建操作
        if (i > e1) {
            if (i <= e2) {
                const nextPods = e2 + 1;
                const anchor = nextPods < c2.length ? c2[nextPods].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        // 4.旧的比新的长,删除老的多出不得部分
        if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        // 5.中间对比
        // 5.1 删除旧的（在旧的里面存在，新的里面不存在）
        let s1 = i; // 旧节点的开始位置（这里指的是被收敛的区间的开始的第一个位置下标）
        let s2 = i; // 新节点的开始位置（这里指的是被收敛的区间的开始的第一个位置下标）
        const toBePatched = e2 - s2 + 1; // 记录新节点的需要更新的总数量
        let patched = 0; // 当前处理的数量
        const keyToNewIndexMap = new Map(); // 为新节点建立缓存映射表，以减少不必要的遍历查找
        const newIndexToOldIndexMap = new Array(toBePatched);
        let moved = false;
        let maxNewIndexSoFar = 0;
        for (let i = 0; i < toBePatched; i++) {
            newIndexToOldIndexMap[i] = 0;
        }
        for (let i = s2; i <= e2; i++) {
            const nextChild = c2[i];
            keyToNewIndexMap.set(nextChild.key, i);
        }
        // 遍历老节点查找每一个老节点在新节点中是否存在
        for (let i = s1; i <= e1; i++) {
            const prevChild = c1[i];
            let newIndex;
            // 如果处理的数量大于新节点更新的总数量的话，说明老节点又多余的新节点中没有的节点，直接删除
            if (patched >= toBePatched) {
                hostRemove(prevChild.el);
                continue;
            }
            // 如果用户写了key那就从缓存里去查找，否则遍历查找
            if (prevChild.key !== null) {
                newIndex = keyToNewIndexMap.get(prevChild.key);
            }
            else {
                for (let j = s2; j <= e2; j++) {
                    if (isSameVNodeType(prevChild, c2[j])) {
                        newIndex = j;
                        break;
                    }
                }
            }
            // 如果newIndex不存在那么说明当前节点在新的改动中不存在，那么删除掉它
            // 如果存在的话继续 patch 对比下层
            if (newIndex === undefined) {
                hostRemove(prevChild.el);
            }
            else {
                if (newIndex >= maxNewIndexSoFar) {
                    maxNewIndexSoFar = newIndex;
                }
                else {
                    // 如果新得到的节点的位置小于上一个节点位置那么认为新的节点被移动过位置
                    moved = true;
                }
                newIndexToOldIndexMap[newIndex - s2] = i + 1;
                patch(prevChild, c2[newIndex], container, parentComponent, null);
                patched++;
            }
        }
        // 5.2 移动（节点存在于新的和老的里面，但是位置变了）
        // 为了减少移动的次数，我们需要找到最长递增子序列
        // 最长递增子序列：https://leetcode.cn/problems/longest-increasing-subsequence/
        // 没有最长递增子序列的效果就是收敛区间中的所有节点都被遍历一遍逐个检查是否要移动
        const increasingNewIndexSequence = moved
            ? getSequence(newIndexToOldIndexMap)
            : [];
        let j = increasingNewIndexSequence.length - 1; // 最长递增子序列的指针
        // 遍历新节点，将中间收敛区域与最长递增子序列做对比
        // 从后往前插入，因为前面的的节点是不稳定的
        for (let i = toBePatched - 1; i >= 0; i--) {
            const nextIndex = i + s2;
            const nextChild = c2[nextIndex];
            const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
            // 5.3 创建新的（在旧的里面不存在，新的里面存在）
            // 在映射中的值还是0的话说明没有
            if (newIndexToOldIndexMap[i] === 0) {
                patch(null, nextChild, container, parentComponent, anchor);
            }
            else if (moved) {
                // 如果当前i不等于最长递增子序列的值，那需要被移动位置
                if (j < 0 || i !== increasingNewIndexSequence[j]) {
                    console.log(TAG, 'patchKeyedChildren', '中间对比-需要移动', i);
                    hostInsert(nextChild.el, container, anchor);
                }
                else {
                    j--;
                }
            }
        }
    }
    /**
     * 将子节点从当前节点移除
     * @param children 子节点
     */
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    /**
     * 根据组件实例 递归渲染，过程为先 通过调用组件实例的render获取到vnode树，然后patch
     * patch 会递归判断 vnode 的节点类型，最终会执行到 mountElement，更新到相应的DOM
     * @param instance 组件实例
     * @param initialVNode 根实例的节点
     * @param container 根容器
     * @param anchor 添加元素的时候所需要的锚点位置
     */
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // 用 effect 来将视图更新流程作为副作用，当依赖发生改变的时候会再次执行视图更新流程
        // 这个过程中会地爱用render生成新的vnode tree，然后通过 patch 更新
        // 注意：有些同学可能不理解这里明明只执行了副作用，又没有跟响应式关联起来怎么会被再次执行呢？
        // 首先，我们要做到响应式视图更新，那我们在 h 函数或者 <template> 中必定要使用响应式数据
        // 有可能是ref()或者reactive()定义的变量，那其实在第一次被渲染的时候（也就是调用本方法）的
        // 时候执行了这里的 effect，effect 中的run被代用那么此时 activeEffect 是不是就保存了现
        // 在这个更新视图流程的副作用，那么下次 ref()或者reactive()定义的数据改变后，这个副作用
        // 再次被执行是不是相当于重新跑了一遍新的render->patch流程
        // 视图中依赖的每一个变量都会收集依赖副作用，所以视图中任意变量改变都会重新跑一次本函数
        // effect 函数会返回一个runner 用于手动执行回调fn，在这里保存runner到实例上便于组件更新操作
        instance.update = effect(() => {
            // 触发 render -> path 流程现在就有两种情况了：1.初始化渲染 2.更新渲染
            // 所有我们要区分出哪些是更新流程哪些是初始化，并且只更新需要更新的vnode
            // 在实例中增加isMounted，如果被挂载过了，说明是更新操作，否则是初始化渲染
            if (!instance.isMounted) {
                // 注意之前我们做了instance 的代理（setupStatefulComponent方法中）
                // 所以这里的 proxy 是 instance 的代理
                const { proxy } = instance;
                // 调用render获得虚拟节点树，并保存初始化的时候的subTree，便于在更新的时候拿到旧的
                // subTree 与新的 subTree 做对比
                debugger;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // vnode -> patch -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                instance.isMounted = true; // 初始化都标识为已挂载
                // 这里所有的element都被mount了
                initialVNode.el = subTree.el;
                console.log(TAG, 'setupRenderEffect->执行了初始化渲染', instance);
            }
            else {
                /* 更新流程 */
                // next: 即将更新的VNode, vnode: 原来（更新前）的 vnode
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el; // 先将el替换
                    updateComponentPreRender(instance, next); // 更新组件属性
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy); // 得到最新的 subTree
                const preSubTree = instance.subTree; // 获取上一次的subTree
                instance.subTree = subTree; // 更新最新的subTree
                patch(preSubTree, subTree, container, instance, anchor);
                console.log(TAG, 'setupRenderEffect', '执行了更新渲染', instance, subTree, preSubTree);
            }
        }, 
        // 因为我们不需要每次更新都立马去更新视图，不需要是一个同步的操作，当数据变化
        // 很频繁的时候会性能很低下，此时我们需要使用异步的方式去更新，如何实现呢？
        // 不要忘记我们 effect 是支持 options 的，在实现计算属性就使用到了scheduler
        // 我们可以同理使用 scheduler 来收集每次更新操作，这些操作看做一个任务，把他们
        // 用队列有序的收集起来，用异步的方式去顺序执行，还可以在收集任务的时候做去重处理
        {
            scheduler() {
                console.log(TAG, 'setupRenderEffect-effect-scheduler: 执行了更新操作的调度器，开始收集试图更新任务');
                // 开始收集更新任务，这里收集的是effect的runner，在数据更新的时候可以手动调用来更新视图
                queueJobs(instance.update);
            },
        });
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVnode) {
    instance.vnode = nextVnode;
    instance.next = null;
    instance.props = nextVnode.props; // 更新props，这里是简单处理直接赋值的
}
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

//---------------------------DOM API-----------------------------
function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    // 处理事件注册
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    // parent.appendChild(child)
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createElement: createElement,
    patchProp: patchProp,
    insert: insert,
    remove: remove,
    setElementText: setElementText,
    createApp: createApp,
    h: h,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    renderSlots: renderSlots,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperNameMap = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode',
};

// -----------------------------codegen 用于将 ast 生成 render 函数-------------------------------------
function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx, _cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}){`);
    push('return ');
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code,
    };
}
// 生成function处理
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    const aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`;
    if (ast.helpers.length) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`);
    }
    push('\n');
    push('return ');
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperNameMap[key]}`;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* TEXT */:
            genText(node, context);
            break;
        case 0 /* INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}
function genExpression(node, context) {
    const { push } = context;
    push(node.content);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    // genNode(children, context)
    push(')');
}
function genCompoundExpression(node, context) {
    const children = node.children;
    const { push } = context;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg || 'null');
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(', ');
        }
    }
}

// parse 主要是用于将 template 选项中的模板代码字符串转化为 ast
/**
 * 解析模板代码字符串为 ast
 * 我画了一下整个解析过程的有限状态机的简单示意图：
 * https://www.processon.com/view/link/629c5ce81efad4162c7d2420
 * 有限状态机与正则表达式使用密切，这里实现的比较简单，解析的规则定的也比较
 * 简单，下面我附上了 vue3 中解析 HTML 的规则，有兴趣的可以深入了解
 * https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
 * https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
 * https://html.spec.whatwg.org/multipage/parsing.html#end-tag-open-state
 * https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element
 * @param content 初始解析的模板代码字符串
 * @returns ast
 */
function baseParse(content) {
    const context = createParseContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith('{{')) {
            // 普通的插值类型
            node = parseInterpolation(context);
        }
        else if (s[0] === '<') {
            // element 类型
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        // 如果 node 没有值说明不是插值或者 element 认为是一个普通字符串
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function parseInterpolation(context) {
    // {{message}}
    // 这个过程是不断推进的，所以能看到字符串被处理过的部分都是被截取掉的
    // 剩下的都是没有被处理的
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length); // 截掉前面两个字符"{{"，并推进
    const rowContentLength = closeIndex - openDelimiter.length; // 计算中间内容的长度
    const rawcontent = context.source.slice(0, rowContentLength);
    parseTextData(context, rowContentLength); // 拿到真实的内容，并删除处理完的数据并推进
    const content = rawcontent.trim(); // 边缘处理
    advanceBy(context, closeDelimiter.length); // 在 parseTextData 中已经推进了内容的长度，再次经closeDelimiter删除并推进即可
    return {
        type: 0 /* INTERPOLATION */,
        content: {
            type: 1 /* SIMPLE_EXPRESSION */,
            content,
        },
    };
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* Start */); // 解析出tag，并删除标签左边部分（<div>），并推进
    ancestors.push(element); // 收集祖先元素
    element.children = parseChildren(context, ancestors);
    ancestors.pop(); // 递归解析完后代后应该弹出自己
    // 当前结束标签和开始标签一样，那就消费这个tag
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* End */); // 删除标签右边部分（</div>），并推进
    }
    else {
        // 如果不相等，说明缺少结束标签
        throw new Error(`缺少结束标签：${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith('</') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    // 1.解析元素tag
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1]; // 先默认都是能解析出来的正确代码
    // 2.删除处理完成的代码，并推进
    advanceBy(context, match[0].length); // 删除左边并推进
    advanceBy(context, 1); // 删除右尖括号
    // 如果是结束标签的话不需要返回element
    if (type === 1 /* End */) {
        return;
    }
    return {
        type: 2 /* ELEMENT */,
        tag,
    };
}
/**
 * 解析纯文本需要从文本中剔除插值，需要以“{{”和“}}”来判断解析位置
 * @param context 记录解析信息上下文
 * @returns
 */
function parseText(context) {
    let endIndex = context.source.length;
    // 如果遇到“{{” 就认为是插值开始了，但是实际情况还要更复杂
    // 用户可能就值输入了 “{{” 没有输入 “}}”，还有可能嵌套其他
    // 标签，导致下面的endToken应该是个数组
    let endTokens = ['<', '{{'];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        // 如果能找到 endTokens 的话就可以更新 endIndex 了
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    // 获取内容，并删除和推进
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* TEXT */,
        content,
    };
}
/**
 * 获取文本内容并推进
 * @param context context
 * @param length 要删除并推进的长度
 */
function parseTextData(context, length) {
    // 1.获取内容
    const content = context.source.slice(0, length);
    // 2.删除解析过的字符并推进
    advanceBy(context, length);
    return content;
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
/**
 * 判断编译的字符是否结束，要特别注意用户可能没有写结束标签
 * 需要判断出来这种情况，否则在编译的时候将出现死循环，怎么破？
 * Dom 是嵌套的，我们在解析标签的时候，应该每次把之前解析过的
 * tag 用一个栈保存下来，如果有上一个标签被闭合了，说明当前处理
 * 的标签没有被闭合，用户写了一个错误的标签，直接将其忽视并作为
 * 纯字符串处理
 * @param context
 * @param ancestors 祖先tags
 * @returns string | undefined
 */
function isEnd(context, ancestors) {
    // 当遇到结束标签的时候
    const s = context.source;
    // 如果当前解析的字符串是某个标签的结束标签，那需要与祖先tag对比
    if (s.startsWith('</')) {
        // 如果用户写的模板没有错误，那当前处理的元素更靠近栈顶，从栈顶开始往栈底找的话会比较快
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            // </div> 解析出当前的tag，并判断是否与某个祖先tag命中
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // 当source还有值的时候
    return !context.source;
}
function createParseContext(content) {
    return {
        source: content,
    };
}
function createRoot(children) {
    return {
        children,
        type: 4 /* ROOT */,
    };
}

// transform 的职责是对 ast 进行增删改查
function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1. 深度优先搜索
    traverseNode(root, context);
    // 2.修改 ast，root.codegenNode
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function traverseNode(node, context) {
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        // 收集退出插件的尾函数
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    switch (node.type) {
        case 0 /* INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* ROOT */:
        case 2 /* ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    // 开始执行收集到的插件尾函数
    let i = exitFns.length;
    // 从后往前执行
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            // 中间处理层
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps; // 暂时不处理
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* TEXT */ || node.type === 0 /* INTERPOLATION */;
}

/**
 * 创建一种符合类型的 ast 节点，他是 text 和插值类型的组合
 * @param node node
 * @param context TransformContext
 */
function transformText(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                // 如果是一个文本节点或者插值节点，继续搜索相邻的
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                // 这个容器就是新创建出来的ast复合类型节点
                                currentContainer = children[i] = {
                                    type: 5 /* COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                            children.splice(j, 1); // 删除已经添加过的next
                            j--; // 因为splice删除元素后，后面的元素会自动移动到前面，所以这里要更新j指针位置
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

// -----------------------------这里是 compiler 的出口文件-----------------------------------
function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

// mini-vue 出口
/**
 * baseCompile 返回值不是render函数，这里要生成这个render 函数
 * @param template
 */
function comileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDom);
    console.log(11111111111, render);
    return render;
}
registerRuntimeCompiler(comileToFunction);

exports.createApp = createApp;
exports.createElement = createElement;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.insert = insert;
exports.nextTick = nextTick;
exports.patchProp = patchProp;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.remove = remove;
exports.renderSlots = renderSlots;
exports.setElementText = setElementText;
exports.toDisplayString = toDisplayString;
