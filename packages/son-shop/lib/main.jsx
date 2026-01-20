import { lazy, Suspense, useEffect, Profiler } from "react";
import Header from "components/Header";


const SonShopApp = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="shop-app">
                <h1>son-shop</h1>
            </div>
            <Header />
        </Suspense>
    );
};

export default SonShopApp;