import React from 'react';
import { Provider } from 'react-redux'; // ✅ 导入 Provider
import { store } from './src/store/store';   // ✅ 你项目中的 store 路径

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, TransitionSpecs } from '@react-navigation/stack';

import GIFTest from './src/screens/tests/GIFTest';
import Home from './src/screens/apps/home/home';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  return (
    <Provider store={store}> {/* ✅ 包裹整个 app */}
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
            transitionSpec: {
              open: {
                animation: 'timing',
                config: { duration: 800 },
              },
              close: {
                animation: 'timing',
                config: { duration: 800 },
              },
            },
          }}
        >
          <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

export default App;