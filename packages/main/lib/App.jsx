import React, {useEffect} from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import { utilsSayHi } from "utils";
const App = () => {
    useEffect(() => {
        const txt = utilsSayHi();
        console.log(`main  utils said: ${txt}`);
    }, []);
    return (
        <React.StrictMode>
            <h1>测试1starting......这是主应用</h1>
            <BrowserRouter basename={process.env.NODE_ENV === 'development' ? '/' : '/microfrontend/'}>
                <Link to="/shop">shop</Link>
            </BrowserRouter>
            <div id='child-container'></div>
        </React.StrictMode>
    )
};

export default App;