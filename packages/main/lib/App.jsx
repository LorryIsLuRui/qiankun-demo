import React, { useEffect } from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { utilsSayHi } from "utils";
import './index.less';

// 导入 Redux actions 和 selectors
import { 
  fetchUserInfo, 
  updateUserField,
  selectUser, 
  selectUserLoading, 
  selectUserError 
} from './store/slices/userSlice';

window.main_loaded = true;

const text = new Array(1).fill('This is some sample text to demonstrate the main application. ').join('');
const img = "https://gw.alipayobjects.com/zos/bmw-prod/8a74c1d3-16f3-4719-be63-15e467a68a24/km0cv8vn_w500_h500.png";

const App = () => {
    // 使用 Redux hooks
    const dispatch = useDispatch();
    const userInfo = useSelector(selectUser);
    const loading = useSelector(selectUserLoading);
    const error = useSelector(selectUserError);

    useEffect(() => {
        const txt = utilsSayHi();
        console.log(`main  utils said: ${txt}`);
        
        // 自动获取用户信息
        dispatch(fetchUserInfo('123'));
    }, [dispatch]);

    // 处理用户名更新
    const handleUpdateName = () => {
        dispatch(updateUserField({ 
            field: 'name', 
            value: '李四 (已更新)' 
        }));
    };

    return (
        <React.StrictMode>
            <div className="main-app">
                <div className='main-content'>
                    <img src={img} alt="Qiankun Logo" className='logo'/>
                    <div>{text}</div>
                    <div className="desc">i am main</div>
                    
                    {/* Redux 状态展示 */}
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '20px', 
                        background: '#f5f5f5',
                        borderRadius: '8px'
                    }}>
                        <h3>Redux 用户信息:</h3>
                        {loading && <p>加载中...</p>}
                        {error && <p style={{ color: 'red' }}>错误: {error}</p>}
                        {userInfo && (
                            <div>
                                <p><strong>用户名:</strong> {userInfo.name}</p>
                                <p><strong>邮箱:</strong> {userInfo.email}</p>
                                <p><strong>角色:</strong> {userInfo.role}</p>
                                <button 
                                    onClick={handleUpdateName}
                                    style={{
                                        padding: '8px 16px',
                                        marginTop: '10px',
                                        cursor: 'pointer',
                                        background: '#1890ff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px'
                                    }}
                                >
                                    更新用户名
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className='sub-content'>
                    <h2>这是主应用中的子应用区域:</h2>
                </div>
                <BrowserRouter basename={process.env.NODE_ENV === 'development' ? '/' : '/microfrontend/'}>
                    <Link to="/shop">shop</Link>
                </BrowserRouter>
                <div id='app-child-container'>
                    
                </div>
                <div style={{ height: '50px', background: 'red' }}></div>
                <div id="son-child-container"></div>
            </div>
        </React.StrictMode>
    )
};

export default App;