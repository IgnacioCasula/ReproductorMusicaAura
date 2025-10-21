import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

export default function Home({ navigation }) {

  const handleLogOut = async () => {
    try {
      await signOut(auth);  
      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
      navigation.replace('Login');  
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al cerrar sesión.");
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
        <Text style={styles.subtitle}>Tu música, en cualquier lugar</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.playerCard}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/200x200/4a4a8a/ffffff?text=🎵' }} 
            style={styles.albumArt}
          />
          <Text style={styles.songTitle}>Canción Actual</Text>
          <Text style={styles.artist}>Artista</Text>
          
          <View style={styles.playerControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.controlText}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playText}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.controlText}>⏭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
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
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0ff',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginBottom: 20,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  artist: {
    fontSize: 16,
    color: '#b0b0ff',
    marginBottom: 30,
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
  },
  controlButton: {
    padding: 15,
  },
  controlText: {
    fontSize: 24,
    color: '#fff',
  },
  playButton: {
    backgroundColor: '#8a2be2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 30,
    alignSelf: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});