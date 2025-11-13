import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  Alert, ActivityIndicator, Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { db, auth } from '../src/config/firebaseConfig';
import { 
  doc, onSnapshot, updateDoc, arrayRemove, arrayUnion,
  collection, query, where 
} from 'firebase/firestore';
import { Audio } from 'expo-av';

// Variables globales para control de audio
let globalSoundInstance = null;
let globalPlaybackStatus = {
  isPlaying: false,
  currentSong: null
};

const PlaylistDetailScreen = ({ route, navigation }) => {
  const { playlist } = route.params;
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  
  // Estado de reproducción
  const [isPlaying, setIsPlaying] = useState(globalPlaybackStatus.isPlaying);
  const [currentSong, setCurrentSong] = useState(globalPlaybackStatus.currentSong);

  // CARGAR CANCIONES DE LA PLAYLIST Y TODAS LAS CANCIONES DEL USUARIO
  useEffect(() => {
    if (auth.currentUser) {
      // Cargar playlist en tiempo real
      const playlistUnsubscribe = onSnapshot(
        doc(db, 'playlists', playlist.id), 
        (doc) => {
          if (doc.exists()) {
            const playlistData = doc.data();
            setPlaylistSongs(playlistData.songs || []);
          }
        }
      );

      // Cargar todas las canciones del usuario
      const songsQuery = query(
        collection(db, 'songs'), 
        where('userId', '==', auth.currentUser.uid)
      );
      
      const songsUnsubscribe = onSnapshot(songsQuery, (querySnapshot) => {
        const songsData = [];
        querySnapshot.forEach((doc) => {
          songsData.push({ id: doc.id, ...doc.data() });
        });
        setAllSongs(songsData);
        setLoading(false);
      });

      return () => {
        playlistUnsubscribe();
        songsUnsubscribe();
      };
    }
  }, [playlist.id]);

  // DETENER REPRODUCCIÓN
  const stopAllPlayback = async () => {
    if (globalSoundInstance) {
      try {
        await globalSoundInstance.stopAsync();
        await globalSoundInstance.unloadAsync();
        globalSoundInstance = null;
      } catch (error) {
        console.log("Error deteniendo sonido:", error);
      }
    }
    
    globalPlaybackStatus = { isPlaying: false, currentSong: null };
    setIsPlaying(false);
    setCurrentSong(null);
  };

  // REPRODUCIR CANCIÓN
  const playSong = async (song) => {
    try {
      await stopAllPlayback();

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audioFile },
        { 
          shouldPlay: true,
          staysActiveInBackground: false
        }
      );
      
      globalSoundInstance = newSound;
      globalPlaybackStatus = { isPlaying: true, currentSong: song };
      setCurrentSong(song);
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Error reproduciendo canción:', error);
      Alert.alert('Error', 'No se pudo reproducir la canción');
    }
  };

  // PAUSAR CANCIÓN
  const pauseSong = async () => {
    if (globalSoundInstance) {
      await globalSoundInstance.pauseAsync();
      globalPlaybackStatus.isPlaying = false;
      setIsPlaying(false);
    }
  };

  // REANUDAR CANCIÓN
  const resumeSong = async () => {
    if (globalSoundInstance) {
      await globalSoundInstance.playAsync();
      globalPlaybackStatus.isPlaying = true;
      setIsPlaying(true);
    }
  };

  // AGREGAR CANCIÓN A PLAYLIST
  const addSongToPlaylist = async (song) => {
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), {
        songs: arrayUnion({
          id: song.id,
          title: song.title,
          artist: song.artist,
          audioFile: song.audioFile,
          duration: song.duration
        }),
        songCount: (playlistSongs.length + 1)
      });

      setAddModalVisible(false);
      Alert.alert('Éxito', 'Canción agregada a la playlist');
    } catch (error) {
      console.error('Error agregando canción:', error);
      Alert.alert('Error', 'No se pudo agregar la canción');
    }
  };

  // ELIMINAR CANCIÓN DE PLAYLIST
  const removeSongFromPlaylist = (song) => {
    Alert.alert(
      'Eliminar de Playlist',
      `¿Eliminar "${song.title}" de la playlist?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'playlists', playlist.id), {
                songs: arrayRemove(song),
                songCount: Math.max(0, (playlistSongs.length - 1))
              });
            } catch (error) {
              console.error('Error eliminando canción:', error);
              Alert.alert('Error', 'No se pudo eliminar la canción');
            }
          },
        },
      ]
    );
  };

  // RENDERIZAR CANCIÓN EN PLAYLIST
  const renderPlaylistSong = ({ item }) => (
    <View style={styles.songCard}>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
        <Text style={styles.songDetails}>{item.duration}</Text>
      </View>
      
      <View style={styles.songActions}>
        {currentSong?.id === item.id ? (
          isPlaying ? (
            <TouchableOpacity onPress={pauseSong} style={styles.controlButton}>
              <FontAwesome name="pause" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={resumeSong} style={styles.controlButton}>
              <FontAwesome name="play" size={20} color="#fff" />
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity 
            onPress={() => playSong(item)} 
            style={styles.playButton}
          >
            <FontAwesome name="play" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          onPress={() => removeSongFromPlaylist(item)}
          style={styles.deleteButton}
        >
          <FontAwesome name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // RENDERIZAR CANCIÓN PARA AGREGAR
  const renderAddSong = ({ item }) => (
    <TouchableOpacity 
      style={styles.addSongCard}
      onPress={() => addSongToPlaylist(item)}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
        <Text style={styles.songDetails}>{item.duration}</Text>
      </View>
      <FontAwesome name="plus" size={16} color="#8a2be2" />
    </TouchableOpacity>
  );

  // CANCIONES DISPONIBLES PARA AGREGAR (no están en la playlist)
  const availableSongs = allSongs.filter(song => 
    !playlistSongs.some(playlistSong => playlistSong.id === song.id)
  );

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a2be2" />
          <Text style={styles.loadingText}>Cargando playlist...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            stopAllPlayback();
            navigation.goBack();
          }}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{playlist.name}</Text>
          <Text style={styles.subtitle}>
            {playlistSongs.length} {playlistSongs.length === 1 ? 'canción' : 'canciones'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addSongButton}
          onPress={() => setAddModalVisible(true)}
        >
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* LISTA DE CANCIONES EN PLAYLIST */}
      {playlistSongs.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="music" size={60} color="#8a2be2" />
          <Text style={styles.emptyText}>Playlist vacía</Text>
          <Text style={styles.emptySubtext}>
            Agrega canciones presionando el botón +
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlistSongs}
          renderItem={renderPlaylistSong}
          keyExtractor={item => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL PARA AGREGAR CANCIONES */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Canciones</Text>
              <TouchableOpacity 
                onPress={() => setAddModalVisible(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {availableSongs.length === 0 ? (
              <View style={styles.emptyModal}>
                <Text style={styles.emptyModalText}>
                  No hay canciones disponibles para agregar
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableSongs}
                renderItem={renderAddSong}
                keyExtractor={item => item.id}
                style={styles.modalList}
              />
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

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
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    padding: 12,
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#b0b0ff',
    textAlign: 'center',
  },
  addSongButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    padding: 12,
    borderRadius: 20,
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
  addSongCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 8,
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
  playButton: {
    backgroundColor: '#8a2be2',
    padding: 8,
    borderRadius: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    height: '80%',
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  modalList: {
    flex: 1,
  },
  emptyModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyModalText: {
    color: '#b0b0ff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default PlaylistDetailScreen;