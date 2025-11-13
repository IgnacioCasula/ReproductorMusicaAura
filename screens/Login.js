import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';


export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingrese ambos campos.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Login exitoso", "Has iniciado sesión correctamente.");
      
    } catch (error) {
      let errorMessage = "Hubo un problema al iniciar sesión.";
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = "El formato del correo electrónico no es válido.";
          break;
        case 'auth/wrong-password':
          errorMessage = "La contraseña es incorrecta.";
          break;
        case 'auth/user-not-found':
          errorMessage = "No se encontró un usuario con este correo.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Error de conexión, por favor intenta más tarde.";
          break;
      }
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo} 
        />
        <Text style={styles.appName}>Aura</Text>
        <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="envelope" size={20} color="#8a2be2" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Ingrese su correo"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="lock" size={20} color="#8a2be2" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Ingrese su contraseña"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome 
                name={showPassword ? "eye-slash" : "eye"} 
                size={20} 
                color="#8a2be2" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signUpLink} 
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signUpText}>
            ¿No tienes cuenta aún? <Text style={styles.signUpHighlight}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 50,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0ff',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#8a2be2',
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#8a2be2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signUpLink: {
    marginTop: 25,
    alignItems: 'center',
  },
  signUpText: {
    color: '#b0b0ff',
    fontSize: 16,
  },
  signUpHighlight: {
    color: '#8a2be2',
    fontWeight: 'bold',
  },
});