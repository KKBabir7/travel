import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER 
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

import authReducer from './authSlice.js';
import chatReducer from './chatSlice.js';
import notificationReducer from './notificationSlice.js';

const persistConfig = {
  key: 'travelsphere_root',
  version: 1,
  storage,
  whitelist: ['auth'] // Only persist Auth state to avoid stale chat or notifications lists
};

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  notification: notificationReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
