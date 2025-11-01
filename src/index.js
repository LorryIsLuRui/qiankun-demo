// 项目入口文件


// import _ from 'lodash';

//  function component() {
//    const element = document.createElement('div');

//   // Lodash, currently included via a script, is required for this line to work
//   element.innerHTML = _.join(['Hello', 'webpack'], ' ');

//   return element;
// }

// document.body.appendChild(component());

import './public-path';
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './bootstrap';


const render = (props) => {
  const root = createRoot(document.querySelector('#root'));
  root.render(<App />);
}

if (!window.__POWERED_BY_QIANKUN__) {
  render({});
}
