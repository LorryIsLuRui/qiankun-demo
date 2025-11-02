import React from 'react';
import { BrowserRouter, Routes, Route, Switch, Link } from 'react-router-dom';
// import { NavLink } from 'react-router-dom';

const App = () => {
    return (
        <React.StrictMode>
            <h1>starting......这是主应用</h1>
            <BrowserRouter basename={window.__POWERED_BY_QIANKUN__ ? '/main' : '/'}>
                {/* <Switch> */}
                <Link to="/shop">shop</Link>
                {/* </Switch> */}
            </BrowserRouter>
            <div id='child-container'></div>
        </React.StrictMode>
    )
};

export default App;