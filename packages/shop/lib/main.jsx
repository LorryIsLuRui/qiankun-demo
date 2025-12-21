import {lazy, Suspense, useEffect, Profiler } from "react";
import Header from "components/Header";
import { utilsSayHi } from "utils/index";
const LazyShopContent = lazy(() => import("./ShopContent"));
import "./index.less";

// 尝试修改主应用的属性
window.main_loaded = false; 
// 子应用挂载后执行
window.shop_loaded = true;

setTimeout(() => {
  console.log('子应用内 shop_loaded:', window.shop_loaded); // 预期：true（子应用自己写入的）
  console.log('子应用内 main_loaded:', window.main_loaded); // 代理沙箱下：false（仅子应用代理层修改）
  console.log('子应用访问顶层 main_loaded:', window.top.main_loaded); // 预期：true（主应用真实值）
}, 3000);

const ShopApp = ({ qiankunProps }) => {

    useEffect(() => {
        const txt = utilsSayHi();
        console.log(txt);
        
        // 访问主应用的 Redux store
        if (qiankunProps?.mainStore) {
            console.log('=== 子应用访问主应用 Redux Store ===');
            
            // 获取主应用状态
            const mainState = qiankunProps.getMainState();
            console.log('主应用用户信息:', mainState.user);
            
            // 也可以直接调用主应用的 action
            // 例如：更新主应用的用户名
            // qiankunProps.dispatchMainAction(updateUserField({ 
            //   field: 'name', 
            //   value: '从 shop 子应用更新' 
            // }));
        }
    }, [qiankunProps]);
    
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="shop-app">
                <h1>Welcome to the Shop Application!</h1>
                <div className="desc">shop desc</div>
                
                {/* 展示主应用的用户信息 */}
                {qiankunProps?.mainStore && (
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '15px', 
                        background: '#e6f7ff',
                        borderRadius: '4px'
                    }}>
                        <h3>📦 从主应用获取的用户信息:</h3>
                        <p>用户名: {qiankunProps.getMainState()?.user?.userInfo?.name || '暂无'}</p>
                        <p>邮箱: {qiankunProps.getMainState()?.user?.userInfo?.email || '暂无'}</p>
                    </div>
                )}
                
                <Profiler id="ShopApp" onRender={(id, phase, actualDuration, baseDuration) => {
                    console.log(`====ShopApp rendered in ${actualDuration}ms during ${phase} phase ${baseDuration} baseDuration`);
                }}>
                    <div className="shop-content">
                        {/* Lazy load the shop content */}
                        <LazyShopContent />
                    </div>
                </Profiler>
            </div>
            <Header />
        </Suspense>
    );
};

export default ShopApp;