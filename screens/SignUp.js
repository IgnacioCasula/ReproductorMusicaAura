import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../src/config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUp({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [country, setCountry] = useState('');
  const [accountType, setAccountType] = useState('Free');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Todos los campos obligatorios deben ser llenados.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Error",
        "La contraseña debe tener al menos 6 caracteres, incluyendo una letra mayúscula, una minúscula y un número."
      );
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar información adicional del usuario en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        email,
        age: age || null,
        favoriteGenre: favoriteGenre || null,
        country: country || null,
        accountType: accountType || 'Free',
        createdAt: new Date(),
        songsCount: 0,
      });

      Alert.alert("Registro exitoso", "Usuario registrado con éxito.");
      navigation.navigate('Home');
    } catch (error) {
      let errorMessage = "Hubo un problema al registrar el usuario.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "El correo electrónico ya está en uso.";
          break;
        case 'auth/invalid-email':
          errorMessage = "El formato del correo electrónico no es válido.";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña es demasiado débil.";
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo} 
          />
          <Text style={styles.appName}>SoundWave</Text>
          <Text style={styles.subtitle}>Crea tu cuenta</Text>
        </View>

        <View style={styles.formContainer}>
          {/* NOMBRE */}
          <Text style={styles.label}>Nombre *</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="user" size={20} color="#8a2be2" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Ingrese su nombre"
              placeholderTextColor="#888"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* APELLIDO */}
          <Text style={styles.label}>Apellido *</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="user" size={20} color="#8a2be2" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Ingrese su apellido"
              placeholderTextColor="#888"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          {/* EMAIL */}
          <Text style={styles.label}>Correo electrónico *</Text>
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

          {/* EDAD */}
          <Text style={styles.label}>Edad</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="calendar" size={20} color="#8a2be2" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Ingrese su edad"
              placeholderTextColor="#888"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          {/* GÉNERO MUSICAL FAVORITO */}
          <Text style={styles.label}>Género Musical Favorito</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="music" size={20} color="#8a2be2" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: Rock, Pop, Jazz, Clásica"
              placeholderTextColor="#888"
              value={favoriteGenre}
              onChangeText={setFavoriteGenre}
            />
          </View>

          {/* PAÍS */}
          <Text style={styles.label}>País</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="globe" size={20} color="#8a2be2" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: Argentina, México, España"
              placeholderTextColor="#888"
              value={country}
              onChangeText={setCountry}
            />
          </View>

          {/* TIPO DE CUENTA */}
          <Text style={styles.label}>Tipo de Cuenta</Text>
          <View style={styles.accountTypeContainer}>
            <TouchableOpacity 
              style={[
                styles.accountTypeButton, 
                accountType === 'Free' && styles.accountTypeButtonActive
              ]}
              onPress={() => setAccountType('Free')}
            >
              <Text style={[
                styles.accountTypeText,
                accountType === 'Free' && styles.accountTypeTextActive
              ]}>
                Free
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.accountTypeButton, 
                accountType === 'Premium' && styles.accountTypeButtonActive
              ]}
              onPress={() => setAccountType('Premium')}
            >
              <Text style={[
                styles.accountTypeText,
                accountType === 'Premium' && styles.accountTypeTextActive
              ]}>
                Premium
              </Text>
            </TouchableOpacity>
          </View>

          {/* CONTRASEÑA */}
          <Text style={styles.label}>Contraseña *</Text>
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

          {/* CONFIRMAR CONTRASEÑA */}
          <Text style={styles.label}>Confirmar Contraseña *</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="lock" size={20} color="#8a2be2" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirme su contraseña"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <FontAwesome 
                name={showConfirmPassword ? "eye-slash" : "eye"} 
                size={20} 
                color="#8a2be2" 
              />
            </TouchableOpacity>
          </View>

          {/* BOTÓN REGISTRARSE */}
          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpButtonText}>Registrarse</Text>
          </TouchableOpacity>

          {/* LINK A LOGIN */}
          <TouchableOpacity 
            style={styles.loginLink} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta? <Text style={styles.loginHighlight}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 20,
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
  accountTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  accountTypeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  accountTypeButtonActive: {
    backgroundColor: '#8a2be2',
    borderColor: '#8a2be2',
  },
  accountTypeText: {
    color: '#fff',
    fontWeight: '600',
  },
  accountTypeTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  signUpButton: {
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
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loginLink: {
    marginTop: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  loginText: {
    color: '#b0b0ff',
    fontSize: 16,
  },
  loginHighlight: {
    color: '#8a2be2',
    fontWeight: 'bold',
  },
});

