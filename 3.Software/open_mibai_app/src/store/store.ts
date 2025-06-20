import bluetoothReducer from '../modules/bluetooth/bluetoothSlice';
import { configureStore } from '@reduxjs/toolkit';
import { ThunkAction, Action } from '@reduxjs/toolkit';

// 创建 Redux store
export const store = configureStore({
  reducer: {
    bluetooth: bluetoothReducer,        // 蓝牙 reducer
    // ...其他 reducer
  },
});

// 类型定义，方便 useSelector 和 useDispatch 使用
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;