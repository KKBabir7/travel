import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.accessToken);
      }
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
