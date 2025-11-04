import React, {useEffect} from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import { utilsSayHi } from "utils";

const App = () => {
    useEffect(() => {
        const txt = utilsSayHi();
        console.log(txt);
    }, []);
    return (
        <React.StrictMode>
            <h1>starting......这是主应用</h1>
            <BrowserRouter basename={window.__POWERED_BY_QIANKUN__ ? '/main' : '/'}>
                <Link to="/shop">shop</Link>
                <Link to="/utils">utils</Link>
            </BrowserRouter>
            <div id='child-container'></div>
        </React.StrictMode>
    )
};

export default App;