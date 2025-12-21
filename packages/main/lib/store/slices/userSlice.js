// User Slice - 用户状态管理
// 演示同步和异步操作的最佳实践
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 模拟 API 调用（实际项目中替换为真实的 API 服务）
const fakeUserAPI = {
  // 获取用户信息
  fetchUserInfo: (userId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (userId === 'error') {
          reject(new Error('用户不存在'));
        } else {
          resolve({
            id: userId || '123',
            name: '张三',
            email: 'zhangsan@example.com',
            role: 'admin',
            avatar: 'https://gw.alipayobjects.com/zos/bmw-prod/8a74c1d3-16f3-4719-be63-15e467a68a24/km0cv8vn_w500_h500.png',
          });
        }
      }, 1000); // 模拟网络延迟
    });
  },
  
  // 更新用户信息
  updateUserInfo: (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...userData,
          updatedAt: new Date().toISOString(),
        });
      }, 800);
    });
  },
};

// ==================== Async Thunks ====================
// createAsyncThunk 自动生成 pending/fulfilled/rejected action types

// 异步获取用户信息
export const fetchUserInfo = createAsyncThunk(
  'user/fetchUserInfo',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fakeUserAPI.fetchUserInfo(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 异步更新用户信息
export const updateUserInfo = createAsyncThunk(
  'user/updateUserInfo',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fakeUserAPI.updateUserInfo(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== Initial State ====================
const initialState = {
  // 用户信息
  userInfo: null,
  
  // 加载状态
  loading: false,
  
  // 错误信息
  error: null,
  
  // 其他状态
  isLoggedIn: false,
  lastFetchTime: null,
};

// ==================== Slice ====================
const userSlice = createSlice({
  name: 'user',
  initialState,
  
  // 同步 reducers
  reducers: {
    // 登录
    login: (state, action) => {
      state.isLoggedIn = true;
      state.userInfo = action.payload;
    },
    
    // 登出
    logout: (state) => {
      state.isLoggedIn = false;
      state.userInfo = null;
      state.error = null;
    },
    
    // 更新用户字段（本地更新，不调用 API）
    updateUserField: (state, action) => {
      const { field, value } = action.payload;
      if (state.userInfo) {
        state.userInfo[field] = value;
      }
    },
    
    // 清除错误
    clearError: (state) => {
      state.error = null;
    },
  },
  
  // 异步 reducers（extraReducers 处理 thunk actions）
  extraReducers: (builder) => {
    // fetchUserInfo 的处理
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
        state.isLoggedIn = true;
        state.lastFetchTime = new Date().toISOString();
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '获取用户信息失败';
      });
    
    // updateUserInfo 的处理
    builder
      .addCase(updateUserInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
      })
      .addCase(updateUserInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '更新用户信息失败';
      });
  },
});

// 导出同步 actions
export const { login, logout, updateUserField, clearError } = userSlice.actions;

// 导出 selectors（用于从 state 中获取数据）
export const selectUser = (state) => state.user.userInfo;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
export const selectIsLoggedIn = (state) => state.user.isLoggedIn;

// 导出 reducer
export default userSlice.reducer;
