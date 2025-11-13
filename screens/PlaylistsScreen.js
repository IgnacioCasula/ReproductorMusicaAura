import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  Alert, ActivityIndicator, TextInput, Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { db, auth } from '../src/config/firebaseConfig';
import { 
  collection, addDoc, onSnapshot, deleteDoc, doc,
  query, where, updateDoc
} from 'firebase/firestore';

const PlaylistsScreen = ({ navigation }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // CARGAR PLAYLISTS DEL USUARIO
  useEffect(() => {
    if (auth.currentUser) {
      const q = query(
        collection(db, 'playlists'), 
        where('userId', '==', auth.currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const playlistsData = [];
        querySnapshot.forEach((doc) => {
          playlistsData.push({ id: doc.id, ...doc.data() });
        });
        setPlaylists(playlistsData);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  // CREAR NUEVA PLAYLIST
  const createPlaylist = async () => {
    if (!playlistName.trim()) {
      Alert.alert('Error', 'El nombre de la playlist es requerido');
      return;
    }

    try {
      await addDoc(collection(db, 'playlists'), {
        name: playlistName,
        userId: auth.currentUser.uid,
        songs: [],
        createdAt: new Date(),
        songCount: 0
      });

      setPlaylistName('');
      setModalVisible(false);
      Alert.alert('Éxito', 'Playlist creada correctamente');
    } catch (error) {
      console.error('Error creando playlist:', error);
      Alert.alert('Error', 'No se pudo crear la playlist');
    }
  };

  // ELIMINAR PLAYLIST
  const deletePlaylist = (playlist) => {
    Alert.alert(
      'Eliminar Playlist',
      `¿Estás seguro de eliminar "${playlist.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'playlists', playlist.id));
              Alert.alert('Éxito', 'Playlist eliminada correctamente');
            } catch (error) {
              console.error('Error eliminando playlist:', error);
              Alert.alert('Error', 'No se pudo eliminar la playlist');
            }
          },
        },
      ]
    );
  };

  // RENDERIZAR CADA PLAYLIST
  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.playlistCard}
      onPress={() => navigation.navigate('PlaylistDetail', { playlist: item })}
    >
      <View style={styles.playlistInfo}>
        <FontAwesome name="list-ol" size={24} color="#8a2be2" style={styles.playlistIcon} />
        <View style={styles.playlistText}>
          <Text style={styles.playlistName}>{item.name}</Text>
          <Text style={styles.playlistDetails}>
            {item.songCount || 0} {item.songCount === 1 ? 'canción' : 'canciones'}
          </Text>
        </View>
      </View>
      
      <View style={styles.playlistActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            setSelectedPlaylist(item);
            setPlaylistName(item.name);
            setModalVisible(true);
          }}
        >
          <FontAwesome name="edit" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deletePlaylist(item)}
        >
          <FontAwesome name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ACTUALIZAR NOMBRE DE PLAYLIST
  const updatePlaylist = async () => {
    if (!playlistName.trim()) {
      Alert.alert('Error', 'El nombre de la playlist es requerido');
      return;
    }

    try {
      await updateDoc(doc(db, 'playlists', selectedPlaylist.id), {
        name: playlistName
      });

      setPlaylistName('');
      setModalVisible(false);
      setSelectedPlaylist(null);
      Alert.alert('Éxito', 'Playlist actualizada correctamente');
    } catch (error) {
      console.error('Error actualizando playlist:', error);
      Alert.alert('Error', 'No se pudo actualizar la playlist');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a2be2" />
          <Text style={styles.loadingText}>Cargando playlists...</Text>
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
          onPress={() => navigation.navigate('Home')}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Mis Playlists</Text>
        <View style={styles.headerRight} />
      </View>

      {/* LISTA DE PLAYLISTS */}
      {playlists.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="list-alt" size={60} color="#8a2be2" />
          <Text style={styles.emptyText}>No hay playlists</Text>
          <Text style={styles.emptySubtext}>
            Crea tu primera playlist presionando el botón +
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={item => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL PARA CREAR/EDITAR PLAYLIST */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedPlaylist ? 'Editar Playlist' : 'Nueva Playlist'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre de la playlist"
              placeholderTextColor="#888"
              value={playlistName}
              onChangeText={setPlaylistName}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setPlaylistName('');
                  setSelectedPlaylist(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={selectedPlaylist ? updatePlaylist : createPlaylist}
              >
                <Text style={styles.confirmButtonText}>
                  {selectedPlaylist ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTÓN FLOTANTE PARA CREAR PLAYLIST */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          setSelectedPlaylist(null);
          setPlaylistName('');
          setModalVisible(true);
        }}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 44,
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
  playlistCard: {
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
  playlistInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistIcon: {
    marginRight: 15,
  },
  playlistText: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  playlistDetails: {
    fontSize: 12,
    color: '#b0b0ff',
  },
  playlistActions: {
    flexDirection: 'row',
    gap: 10,
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
    width: '80%',
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    backgroundColor: '#8a2be2',
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
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

export default PlaylistsScreen;