import {lazy, Suspense, useEffect } from "react";
import Header from "components/Header";
import { utilsSayHi } from "utils/index";


const ShopApp = () => {

    useEffect(() => {
        const txt = utilsSayHi();
        console.log(txt);
    }, []);
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <h1>11Welcome to the Shop Application</h1>
            {/* <Coms /> */}
            <Header />
        </Suspense>
    );
};

export default ShopApp;