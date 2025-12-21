# 微前端状态共享方案

## 问题
在 qiankun 微前端架构中，子应用无法直接访问主应用的 Redux store，因为它们运行在不同的 JavaScript 沙箱环境中。

## 解决方案

本项目采用 **通过 qiankun props 传递 Redux store** 的方式实现状态共享。

### 实现步骤

#### 1. 主应用配置 (packages/main/lib/bootstrap.js)

```javascript
import { store } from './store';

registerMicroApps([
  {
    name: 'shop',
    // ... 其他配置
    props: { 
      // 传递主应用的 Redux store
      mainStore: store,
      // 传递获取状态的方法
      getMainState: () => store.getState(),
      // 传递分发 action 的方法
      dispatchMainAction: (action) => store.dispatch(action),
    },
  },
]);
```

#### 2. 子应用接收 props (packages/shop/lib/life-cycles.js)

```javascript
export async function mount(props) {
  // 订阅主应用 Redux store 的变化
  if (props.mainStore) {
    props.mainStore.subscribe(() => {
      const mainState = props.mainStore.getState();
      console.log('主应用 Redux 状态变化:', mainState);
    });
  }
  
  // 将 props 传递给子应用组件
  root.render(<App qiankunProps={props} />);
}
```

#### 3. 子应用组件中使用 (packages/shop/lib/main.jsx)

```javascript
const ShopApp = ({ qiankunProps }) => {
  useEffect(() => {
    if (qiankunProps?.mainStore) {
      // 读取主应用状态
      const mainState = qiankunProps.getMainState();
      console.log('主应用用户信息:', mainState.user);
      
      // 分发主应用的 action
      qiankunProps.dispatchMainAction(someAction());
    }
  }, [qiankunProps]);
  
  return (
    <div>
      {/* 展示主应用数据 */}
      <p>{qiankunProps?.getMainState()?.user?.userInfo?.name}</p>
    </div>
  );
};
```

## 其他可选方案

### 方案2: qiankun 全局状态管理（已集成）

适用于简单的跨应用通信：

```javascript
// 主应用
const actions = initGlobalState({ user: 'xxx' });
actions.setGlobalState({ user: 'new value' });

// 子应用
export async function mount(props) {
  props.onGlobalStateChange((state, prev) => {
    console.log('状态变化:', state);
  });
  
  props.setGlobalState({ user: 'from child' });
}
```

### 方案3: 自定义事件总线

```javascript
// 创建事件总线
class EventBus {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }
}

// 挂载到 window
window.microAppEventBus = new EventBus();

// 主应用监听 Redux 变化并广播
store.subscribe(() => {
  window.microAppEventBus.emit('mainStateChange', store.getState());
});

// 子应用订阅
window.microAppEventBus.on('mainStateChange', (state) => {
  console.log('主应用状态:', state);
});
```

## 最佳实践建议

### ✅ 推荐做法

1. **最小化跨应用状态共享** - 各应用尽量独立管理自己的状态
2. **只读访问** - 子应用最好只读取主应用状态，不直接修改
3. **通过接口通信** - 复杂交互通过 API 调用而非状态共享
4. **使用 qiankun props** - 对于必需的共享，通过 props 传递是最清晰的方式

### ❌ 不推荐做法

1. **避免 window 全局污染** - 不要直接挂载 store 到 window
2. **避免双向绑定** - 不要让多个应用同时修改同一份状态
3. **避免过度共享** - 不是所有状态都需要共享

## 架构设计建议

```
┌─────────────────────────────────────────┐
│           主应用 (Main App)              │
│  ┌──────────────────────────────────┐   │
│  │     Redux Store (主状态)          │   │
│  │  - user: 用户信息                 │   │
│  │  - global: 全局配置               │   │
│  └──────────────────────────────────┘   │
│              │                           │
│              │ props 传递                │
│              ▼                           │
│  ┌────────────────────────────────┐     │
│  │       子应用容器                │     │
│  │  ┌──────────────────────────┐  │     │
│  │  │   Shop 子应用             │  │     │
│  │  │  - 接收 mainStore         │  │     │
│  │  │  - 读取主应用状态         │  │     │
│  │  │  - 拥有独立的 Redux store │  │     │
│  │  └──────────────────────────┘  │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### 状态分层

- **全局状态** (主应用) - 用户信息、权限、主题等
- **应用状态** (各子应用) - 各自的业务状态
- **组件状态** (React state) - 临时 UI 状态

## 测试

启动主应用和子应用后：

1. 主应用会自动加载用户信息
2. 子应用挂载时会在控制台打印主应用状态
3. 子应用页面会展示从主应用获取的用户信息
4. 主应用状态变化时，子应用可以实时感知

```bash
# 启动主应用
npm run start --workspace=packages/main

# 新终端启动子应用
npm run start --workspace=packages/shop
```

访问 http://localhost:8080，点击 shop 链接查看效果。

## 常见问题

**Q: 子应用能修改主应用的 Redux 状态吗？**

A: 可以通过 `dispatchMainAction` 分发 action，但不推荐。建议子应用只读取主应用状态。

**Q: 如何保证状态同步？**

A: 通过 `store.subscribe()` 订阅主应用状态变化，在回调中更新子应用的本地状态。

**Q: 性能影响？**

A: 通过 props 传递引用，没有额外的序列化开销。但要注意避免过度订阅导致频繁更新。

**Q: 子应用独立运行时怎么办？**

A: 判断 `qiankunProps` 是否存在，提供降级方案：

```javascript
const userInfo = qiankunProps?.getMainState()?.user || getLocalUserInfo();
```
