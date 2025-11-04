import { useEffect } from "react";
import { utilsSayHi } from "utils";
const ShopApp = () => {

    useEffect(() => {
        const txt = utilsSayHi();
        console.log(txt);
    }, []);
    return (
        <div>
            <h1>11Welcome to the Shop Application</h1>
        </div>
    );
};

export default ShopApp;