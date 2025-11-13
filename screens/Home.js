import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  Alert, ActivityIndicator 
} from 'react-native';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../src/config/firebaseConfig';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

// 🔥 VARIABLES GLOBALES PARA CONTROL CENTRALIZADO
let globalSoundInstance = null;
let globalPlaybackStatus = {
  isPlaying: false,
  currentSong: null,
  currentIndex: -1
};

const Home = ({ navigation }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔥 ESTADO LOCAL SINCRONIZADO CON GLOBAL
  const [isPlaying, setIsPlaying] = useState(globalPlaybackStatus.isPlaying);
  const [currentSong, setCurrentSong] = useState(globalPlaybackStatus.currentSong);
  const [currentIndex, setCurrentIndex] = useState(globalPlaybackStatus.currentIndex);

  // 🔥 REF PARA EVITAR LOOPS
  const isPlayingRef = useRef(false);

  // CARGAR CANCIONES DEL USUARIO
  useEffect(() => {
    if (auth.currentUser) {
      const q = query(
        collection(db, 'songs'), 
        where('userId', '==', auth.currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const songsData = [];
        querySnapshot.forEach((doc) => {
          songsData.push({ id: doc.id, ...doc.data() });
        });
        setSongs(songsData);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  // 🔥 FUNCIÓN PARA DETENER COMPLETAMENTE LA REPRODUCCIÓN
  const stopAllPlayback = async () => {
    console.log("🔇 Deteniendo toda reproducción...");
    
    if (globalSoundInstance) {
      try {
        // Detener y liberar completamente el sonido
        await globalSoundInstance.stopAsync();
        await globalSoundInstance.unloadAsync();
        globalSoundInstance = null;
      } catch (error) {
        console.log("Error deteniendo sonido:", error);
      }
    }
    
    // Resetear estado global
    globalPlaybackStatus = {
      isPlaying: false,
      currentSong: null,
      currentIndex: -1
    };
    
    // Resetear estado local
    setIsPlaying(false);
    setCurrentSong(null);
    setCurrentIndex(-1);
    isPlayingRef.current = false;
  };

  // 🔥 CALLBACK MEJORADO PARA REPRODUCCIÓN
  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish && !isPlayingRef.current) {
      console.log("🎵 Canción terminó naturalmente");
      isPlayingRef.current = true;
      
      // Pequeño delay antes de reproducir la siguiente
      setTimeout(() => {
        playNext();
      }, 500);
    }
  };

  // 🔥 FUNCIÓN PLAYSONG MEJORADA - DETIENE TODO ANTES DE REPRODUCIR
  const playSong = async (song, index) => {
    try {
      console.log(`🎵 Intentando reproducir: ${song.title}`);
      
      // 🔇 DETENER CUALQUIER REPRODUCCIÓN ACTUAL PRIMERO
      await stopAllPlayback();

      // 🎵 CREAR NUEVA INSTANCIA DE SONIDO
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audioFile },
        { 
          shouldPlay: true,
          staysActiveInBackground: false
        },
        onPlaybackStatusUpdate
      );
      
      // ✅ ACTUALIZAR ESTADO GLOBAL
      globalSoundInstance = newSound;
      globalPlaybackStatus = {
        isPlaying: true,
        currentSong: song,
        currentIndex: index
      };
      
      // ✅ ACTUALIZAR ESTADO LOCAL
      setCurrentSong(song);
      setCurrentIndex(index);
      setIsPlaying(true);
      isPlayingRef.current = false;
      
      console.log(`✅ Reproduciendo: ${song.title}`);
      
    } catch (error) {
      console.error('❌ Error reproduciendo canción:', error);
      Alert.alert('Error', 'No se pudo reproducir la canción');
      await stopAllPlayback(); // Limpiar en caso de error
    }
  };

  // 🔥 PAUSAR CANCIÓN
  const pauseSong = async () => {
    if (globalSoundInstance) {
      try {
        await globalSoundInstance.pauseAsync();
        globalPlaybackStatus.isPlaying = false;
        setIsPlaying(false);
        console.log("⏸️ Canción pausada");
      } catch (error) {
        console.log("Error pausando:", error);
      }
    }
  };

  // 🔥 REANUDAR CANCIÓN
  const resumeSong = async () => {
    if (globalSoundInstance) {
      try {
        await globalSoundInstance.playAsync();
        globalPlaybackStatus.isPlaying = true;
        setIsPlaying(true);
        console.log("▶️ Canción reanudada");
      } catch (error) {
        console.log("Error reanudando:", error);
      }
    }
  };

  // 🔥 DETENER CANCIÓN ACTUAL
  const stopCurrentSong = async () => {
    await stopAllPlayback();
    console.log("⏹️ Canción detenida");
  };

  // 🔥 CANCIÓN ANTERIOR
  const playPrevious = async () => {
    if (songs.length === 0) return;
    
    let newIndex;
    if (currentIndex === -1) {
      newIndex = songs.length - 1;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    }
    
    if (songs[newIndex]) {
      await playSong(songs[newIndex], newIndex);
    }
  };

  // 🔥 SIGUIENTE CANCIÓN
  const playNext = async () => {
    if (songs.length === 0) {
      await stopAllPlayback();
      return;
    }
    
    let newIndex;
    if (currentIndex === -1) {
      newIndex = 0;
    } else {
      newIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
    }
    
    if (songs[newIndex]) {
      await playSong(songs[newIndex], newIndex);
    } else {
      await stopAllPlayback();
    }
  };

  // 🔥 ELIMINAR CANCIÓN
  const deleteSong = async (song) => {
    Alert.alert(
      'Eliminar Canción',
      `¿Estás seguro de eliminar "${song.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Si la canción a eliminar es la que se está reproduciendo, detenerla
              if (globalPlaybackStatus.currentSong?.id === song.id) {
                await stopAllPlayback();
              }
              
              await deleteDoc(doc(db, 'songs', song.id));
              Alert.alert('Éxito', 'Canción eliminada correctamente');
            } catch (error) {
              console.error('Error eliminando canción:', error);
              Alert.alert('Error', 'No se pudo eliminar la canción');
            }
          },
        },
      ]
    );
  };

  // 🔥 CERRAR SESIÓN - DETENER TODO ANTES
  const handleLogOut = async () => {
    try {
      await stopAllPlayback();
      await signOut(auth);
      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      Alert.alert("Error", "Hubo un problema al cerrar sesión.");
    }
  };

  // 🔥 SINCRONIZAR AL VOLVER A HOME
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("🔄 Sincronizando estado al volver a Home...");
      // Sincronizar estado local con global
      setIsPlaying(globalPlaybackStatus.isPlaying);
      setCurrentSong(globalPlaybackStatus.currentSong);
      setCurrentIndex(globalPlaybackStatus.currentIndex);
    });

    return unsubscribe;
  }, [navigation]);

  // 🔥 CLEANUP AL SALIR DE HOME
  useEffect(() => {
    return () => {
      // No detenemos la reproducción al salir de Home, solo al cerrar sesión
      console.log("🏠 Saliendo de Home (reproducción continúa en background)");
    };
  }, []);

  // RENDERIZAR CADA CANCIÓN
  const renderSongItem = ({ item, index }) => (
    <View style={styles.songCard}>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
        <Text style={styles.songDetails}>
          {item.album} • {item.genre} • {item.duration}
        </Text>
      </View>
      
      <View style={styles.songActions}>
        {globalPlaybackStatus.currentSong?.id === item.id ? (
          <View style={styles.playingControls}>
            {globalPlaybackStatus.isPlaying ? (
              <TouchableOpacity onPress={pauseSong} style={styles.controlButton}>
                <FontAwesome name="pause" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={resumeSong} style={styles.controlButton}>
                <FontAwesome name="play" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={stopCurrentSong} style={styles.controlButton}>
              <FontAwesome name="stop" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => playSong(item, index)} 
            style={styles.playButton}
          >
            <FontAwesome name="play" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('AddEditSong', { song: item })}
            style={styles.editButton}
          >
            <FontAwesome name="edit" size={16} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => deleteSong(item)}
            style={styles.deleteButton}
          >
            <FontAwesome name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a2be2" />
          <Text style={styles.loadingText}>Cargando canciones...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Mi Biblioteca Musical</Text>
          <Text style={styles.subtitle}>
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.playlistButton} 
            onPress={() => navigation.navigate('Playlists')}
          >
            <FontAwesome name="list-alt" size={20} color="#fff" />
          </TouchableOpacity>


          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => navigation.navigate('Profile')}
          >
            <FontAwesome name="user" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
            <FontAwesome name="sign-out" size={20} color="#fff" />
          </TouchableOpacity>


        </View>
      </View>

      {/* REPRODUCTOR GLOBAL */}
      {globalPlaybackStatus.currentSong && (
        <View style={styles.globalPlayer}>
          <Text style={styles.nowPlaying}>
            Reproduciendo: {globalPlaybackStatus.currentSong.title}
          </Text>
          <View style={styles.globalControls}>
            <TouchableOpacity onPress={playPrevious} style={styles.navButton}>
              <FontAwesome name="backward" size={20} color="#fff" />
            </TouchableOpacity>
            
            {globalPlaybackStatus.isPlaying ? (
              <TouchableOpacity onPress={pauseSong} style={styles.playPauseButton}>
                <FontAwesome name="pause" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={resumeSong} style={styles.playPauseButton}>
                <FontAwesome name="play" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={playNext} style={styles.navButton}>
              <FontAwesome name="forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.currentArtist}>
            {globalPlaybackStatus.currentSong.artist}
          </Text>
        </View>
      )}

      {/* LISTA DE CANCIONES */}
      {songs.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="music" size={60} color="#8a2be2" />
          <Text style={styles.emptyText}>No hay canciones</Text>
          <Text style={styles.emptySubtext}>
            Agrega tu primera canción presionando el botón +
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSongItem}
          keyExtractor={item => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* BOTÓN AGREGAR CANCIÓN */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddEditSong')}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

// ESTILOS (se mantienen igual)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0ff',
  },
  profileButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    padding: 12,
    borderRadius: 20,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.3)',
    padding: 12,
    borderRadius: 20,
  },
  globalPlayer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  nowPlaying: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  currentArtist: {
    fontSize: 14,
    color: '#8a2be2',
    textAlign: 'center',
    marginTop: 5,
  },
  globalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 10,
  },
  navButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    padding: 15,
    borderRadius: 25,
  },
  playPauseButton: {
    backgroundColor: '#8a2be2',
    padding: 15,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 20,
    color: '#fff',
    marginTop: 20,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#b0b0ff',
    marginTop: 10,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  songCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 14,
    color: '#8a2be2',
    marginBottom: 2,
  },
  songDetails: {
    fontSize: 12,
    color: '#b0b0ff',
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playingControls: {
    flexDirection: 'row',
    gap: 5,
  },
  controlButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  playButton: {
    backgroundColor: '#8a2be2',
    padding: 8,
    borderRadius: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  editButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#8a2be2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#8a2be2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default Home;