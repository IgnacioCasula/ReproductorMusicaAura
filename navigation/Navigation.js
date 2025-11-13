// miapp/navigation/Navigation.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';  
import { auth } from '../src/config/firebaseConfig';  
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import Home from '../screens/Home';
import AddEditSong from '../screens/AddEditSong';

const Stack = createStackNavigator();

function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsAuthenticated(true); 
      } else {
        setIsAuthenticated(false); 
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          // ✅ USUARIO AUTENTICADO - Pantallas principales
          <>
            <Stack.Screen 
              name="Home" 
              component={Home} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="AddEditSong" 
              component={AddEditSong} 
              options={{ 
                title: 'Agregar Canción',
                headerStyle: {
                  backgroundColor: '#1a1a2e',
                },
                headerTintColor: '#fff',
              }} 
            />
          </>
        ) : (
          // ❌ USUARIO NO AUTENTICADO - Pantallas de auth
          <>
            <Stack.Screen 
              name="Login" 
              component={Login} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUp} 
              options={{ headerShown: false }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;