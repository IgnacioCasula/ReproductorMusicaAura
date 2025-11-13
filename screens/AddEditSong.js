import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ScrollView, ActivityIndicator 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRoute, useNavigation } from '@react-navigation/native';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../src/config/firebaseConfig';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

const AddEditSong = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { song } = route.params || {};
  
  // ✅ ESTADO CORREGIDO
  const [audioFile, setAudioFile] = useState(
    song ? { 
      uri: song.audioFile, 
      name: song.fileName || 'Archivo existente',
      size: song.fileSize || 0,
      type: song.fileType || 'audio/mpeg'
    } : null
  );
  
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      title: song?.title || '',
      artist: song?.artist || '',
      album: song?.album || '',
      genre: song?.genre || '',
      duration: song?.duration || '',
    }
  });

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // ✅ ESTRUCTURA CONSISTENTE
        setAudioFile({
          uri: file.uri,
          name: file.name,
          size: file.size,
          type: file.mimeType,
        });
        
        // Obtener duración
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: file.uri },
            { shouldPlay: false }
          );
          
          const status = await sound.getStatusAsync();
          
          if (status.isLoaded) {
            const minutes = Math.floor(status.durationMillis / 60000);
            const seconds = Math.floor((status.durationMillis % 60000) / 1000);
            const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            setValue('duration', duration);
          }
          
          await sound.unloadAsync();
        } catch (audioError) {
          console.error('Error obteniendo duración:', audioError);
          setValue('duration', '0:00');
        }
      }
    } catch (error) {
      console.error('Error seleccionando archivo:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo de audio');
    }
  };

  const onSubmit = async (data) => {
    if (!audioFile) {
      Alert.alert('Error', 'Debes seleccionar un archivo de audio');
      return;
    }

    setLoading(true);

    try {
      // ✅ DATOS CORREGIDOS - Manejar ambos casos (nuevo y edición)
      const songData = {
        title: data.title,
        artist: data.artist,
        album: data.album,
        genre: data.genre,
        duration: data.duration,
        audioFile: audioFile.uri || audioFile, // ✅ Compatible con string y objeto
        fileName: audioFile.name || song?.fileName || 'audio.mp3',
        fileSize: audioFile.size || song?.fileSize || 0,
        fileType: audioFile.type || song?.fileType || 'audio/mpeg',
        userId: auth.currentUser.uid,
        createdAt: song ? song.createdAt : new Date(),
        updatedAt: new Date(), // ✅ Campo nuevo para tracking
      };

      console.log("Guardando canción:", songData);

      if (song) {
        // 🔄 ACTUALIZAR
        await updateDoc(doc(db, 'songs', song.id), songData);
        Alert.alert('Éxito', 'Canción actualizada correctamente');
      } else {
        // ➕ CREAR
        await addDoc(collection(db, 'songs'), songData);
        Alert.alert('Éxito', 'Canción agregada correctamente');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error guardando canción:', error);
      Alert.alert('Error', `No se pudo guardar la canción: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          {song ? 'Editar Canción' : 'Agregar Nueva Canción'}
        </Text>

        {/* TÍTULO */}
        <Text style={styles.label}>Título *</Text>
        <Controller
          control={control}
          name="title"
          rules={{ required: 'El título es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Nombre de la canción"
              placeholderTextColor="#888"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

        {/* ARTISTA */}
        <Text style={styles.label}>Artista *</Text>
        <Controller
          control={control}
          name="artist"
          rules={{ required: 'El artista es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Nombre del artista"
              placeholderTextColor="#888"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.artist && <Text style={styles.errorText}>{errors.artist.message}</Text>}

        {/* ÁLBUM */}
        <Text style={styles.label}>Álbum</Text>
        <Controller
          control={control}
          name="album"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Nombre del álbum"
              placeholderTextColor="#888"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        {/* GÉNERO */}
        <Text style={styles.label}>Género</Text>
        <Controller
          control={control}
          name="genre"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Ej: Rock, Pop, Jazz"
              placeholderTextColor="#888"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        {/* DURACIÓN */}
        <Text style={styles.label}>Duración</Text>
        <Controller
          control={control}
          name="duration"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Se llena automáticamente"
              placeholderTextColor="#888"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              editable={false}
            />
          )}
        />

        {/* SELECTOR DE ARCHIVO */}
        <View style={styles.fileSection}>
          <Text style={styles.label}>Archivo de Audio *</Text>
          <TouchableOpacity style={styles.audioButton} onPress={pickAudio}>
            <FontAwesome name="music" size={20} color="#8a2be2" style={styles.audioIcon} />
            <Text style={styles.audioButtonText}>
              {audioFile ? `✅ ${audioFile.name}` : 'Seleccionar archivo MP3'}
            </Text>
          </TouchableOpacity>
          {!audioFile && (
            <Text style={styles.hintText}>Formatos soportados: MP3, WAV, M4A</Text>
          )}
        </View>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]} 
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {song ? 'Actualizar Canción' : 'Guardar Canción'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 15,
    marginLeft: 5,
  },
  fileSection: {
    marginBottom: 20,
  },
  audioButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8a2be2',
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIcon: {
    marginRight: 10,
  },
  audioButtonText: {
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  hintText: {
    color: '#b0b0ff',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#8a2be2',
    padding: 16,
    borderRadius: 25,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#5a189a',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AddEditSong;