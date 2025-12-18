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

const ShopApp = () => {

    useEffect(() => {
        const txt = utilsSayHi();
        console.log(txt);
    }, []);
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="shop-app">
                <h1>Welcome to the Shop Application!</h1>
                <div className="desc">shop desc</div>
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