import { configureStore } from '@reduxjs/toolkit';
import agentReducer from './agent/index.js';
import compilerReducer from './compiler/index.js';
const store = configureStore({
  reducer: {
    agent: agentReducer,
    compiler: compilerReducer
  },
});

export default store;
export const RootState = store.getState;
export const AppDispatch = store.dispatch;