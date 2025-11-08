import {lazy, Suspense, useEffect } from "react";
import Header from "components/Header";
console.log('===Header Component', Header);


// const utilsEntry = lazy(() => import("utils").then(res => {
//     console.log('===utils module', res);
// }));
// const Coms = lazy(() => import("components/index").then(res => {
//     console.log('===components module', res);
// }));
// import utilsEntry1 from "utils";
// import Coms1 from "components/index";

// console.log('===utilsEntry', utilsEntry);
// console.log('===Coms Component', Coms);


const ShopApp = () => {

    useEffect(() => {
        // const txt = utilsSayHi();
        // console.log(txt);
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