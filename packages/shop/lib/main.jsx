import {lazy, Suspense, useEffect, Profiler } from "react";
import { useSelector, useDispatch } from 'react-redux';
import Header from "components/Header";
import { utilsSayHi } from "utils/index";
import { 
  fetchProducts,
} from './store/slices/productsSlice';
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
    // 使用共享 store 中的商品状态
    const dispatch = useDispatch();
    // 注意：selector 路径改为 shop_products（注入的 reducer key）
    const products = useSelector(state => state.shop_products?.productList || []);
    const cartCount = useSelector(state => {
        const cart = state.shop_products?.cart || [];
        return cart.reduce((total, item) => total + (item.quantity || 1), 0);
    });
    const loading = useSelector(state => state.shop_products?.loading || false);
    
    // 也可以访问主应用的用户状态（同一个 store 树）
    const mainUserInfo = useSelector(state => state.user?.userInfo);

    useEffect(() => {
        const txt = utilsSayHi();
        console.log(txt);
        
        // 加载子应用的商品数据
        dispatch(fetchProducts());
        
        // 打印整个 store 树结构
        if (qiankunProps?.getMainState) {
            const wholeState = qiankunProps.getMainState();
            console.log('🌳 完整 Store 树:', Object.keys(wholeState));
            console.log('📊 Store 数据:', wholeState);
        }
    }, [qiankunProps, dispatch]);
    
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="shop-app">
                <h1>Welcome to the Shop Application!</h1>
                <div className="desc">shop desc</div>
                
                {/* 展示子应用自己的商品状态 */}
                <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    background: '#fff7e6',
                    borderRadius: '4px'
                }}>
                    <h3>🛍️ Shop 子应用的 Redux 状态（共享 Store 树）:</h3>
                    {loading ? (
                        <p>加载商品中...</p>
                    ) : (
                        <>
                            <p>商品数量: {products.length} 个</p>
                            <p>购物车: {cartCount} 件商品</p>
                            <div style={{ marginTop: '10px' }}>
                                {products.slice(0, 3).map(p => (
                                    <div key={p.id} style={{ padding: '5px 0' }}>
                                        {p.name} - ¥{p.price}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                
                {/* 展示主应用的用户信息（同一个 store 树）*/}
                <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    background: '#e6f7ff',
                    borderRadius: '4px'
                }}>
                    <h3>👤 主应用用户信息（共享 Store 树）:</h3>
                    <p>用户名: {mainUserInfo?.name || '暂无'}</p>
                    <p>邮箱: {mainUserInfo?.email || '暂无'}</p>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                        💡 提示：主应用和子应用在同一个 Redux Store 树上
                    </p>
                </div>
                
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