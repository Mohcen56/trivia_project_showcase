import { AnyAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';

/**
 * SECURITY: Token is NOT stored in Redux - only in HttpOnly cookie.
 * Redux only stores the user profile for UI purposes.
 */
export interface AuthState {
  user: any | null;
  isLoaded: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoaded: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user?: any | null }>) => {
      state.user = action.payload.user ?? null;
      state.isLoaded = true;
    },
    logout: (state) => {
      state.user = null;
      state.isLoaded = true;
    },
    markLoaded: (state) => {
      state.isLoaded = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: AnyAction) => {
      const payload = action.payload as { auth?: Partial<AuthState> } | undefined;
      if (payload && payload.auth) {
        state.user = payload.auth.user ?? state.user;
      }
      state.isLoaded = true;
    });
  },
});

export const { setCredentials, logout, markLoaded } = authSlice.actions;
export default authSlice.reducer;
