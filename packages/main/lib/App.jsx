import React, {useEffect} from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import { utilsSayHi } from "utils";
import './index.less';

const App = () => {
    useEffect(() => {
        const txt = utilsSayHi();
        console.log(`main  utils said: ${txt}`);
    }, []);
    return (
        <React.StrictMode>
            <div className="main-app">
                <h1>hi, starting......这是主应用!</h1>
                <div className="desc">i am main</div>
                <BrowserRouter basename={process.env.NODE_ENV === 'development' ? '/' : '/microfrontend/'}>
                    <Link to="/shop">shop</Link>
                </BrowserRouter>
                <div id='child-container'></div>
            </div>
        </React.StrictMode>
    )
};

export default App;