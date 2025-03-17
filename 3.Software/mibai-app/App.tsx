import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BluetoothTest from './src/screens/test/BluetoothTest';
import LiveKitTest from './src/screens/test/LiveKitTest';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="BluetoothTest">
        <Stack.Screen
          name="BluetoothTest"
          component={BluetoothTest}
          options={{
            title: '蓝牙测试',
            headerStyle: {
              backgroundColor: '#f4511e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="LiveKitTest"
          component={LiveKitTest}
          options={{
            title: 'LiveKit测试',
            headerStyle: {
              backgroundColor: '#f4511e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
