import {lazy, Suspense, useEffect } from "react";
import Header from "components/Header";
import { utilsSayHi } from "utils/index";
import "./index.less";


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
            </div>
            <Header />
        </Suspense>
    );
};

export default ShopApp;