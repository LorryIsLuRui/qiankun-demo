import React, { useEffect } from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import { utilsSayHi } from "utils";
import './index.less';
window.main_loaded = true;

const text = new Array(1).fill('This is some sample text to demonstrate the main application. ').join('');
const img = "https://gw.alipayobjects.com/zos/bmw-prod/8a74c1d3-16f3-4719-be63-15e467a68a24/km0cv8vn_w500_h500.png";
const App = () => {
    useEffect(() => {
        const txt = utilsSayHi();
        console.log(`main  utils said: ${txt}`);
    }, []);
    return (
        <React.StrictMode>
            <div className="main-app">
                <div className='main-content'>
                    <img src={img} alt="Qiankun Logo" className='logo'/>
                    <div>{text}</div>
                    <div className="desc">i am main</div>
                </div>
                <div className='sub-content'>
                    <h2>这是主应用中的子应用区域:</h2>
                </div>
                <BrowserRouter basename={process.env.NODE_ENV === 'development' ? '/' : '/microfrontend/'}>
                    <Link to="/shop">shop</Link>
                </BrowserRouter>
                <div id='app-child-container'></div>
            </div>
        </React.StrictMode>
    )
};

export default App;