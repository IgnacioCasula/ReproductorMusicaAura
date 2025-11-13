import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, ScrollView, 
  TouchableOpacity, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../src/config/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const Profile = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [songsCount, setSongsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          // Obtener datos del usuario
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }

          // Contar canciones del usuario
          const songsQuery = query(
            collection(db, 'songs'), 
            where('userId', '==', auth.currentUser.uid)
          );
          const songsSnapshot = await getDocs(songsQuery);
          setSongsCount(songsSnapshot.size);

        } catch (error) {
          console.error('Error cargando datos del perfil:', error);
          Alert.alert('Error', 'No se pudieron cargar los datos del perfil');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No disponible';
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccountTypeColor = (type) => {
    return type === 'Premium' ? '#ffd700' : '#8a2be2';
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a2be2" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER DEL PERFIL */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <FontAwesome name="user-circle" size={80} color="#8a2be2" />
            <View style={[
              styles.accountTypeBadge,
              { backgroundColor: getAccountTypeColor(userData?.accountType) }
            ]}>
              <Text style={styles.accountTypeBadgeText}>
                {userData?.accountType || 'Free'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.userName}>
            {userData?.firstName} {userData?.lastName}
          </Text>
          <Text style={styles.userEmail}>{userData?.email}</Text>
        </View>

        {/* INFORMACIÓN PERSONAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <FontAwesome name="user" size={16} color="#8a2be2" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Nombre completo</Text>
              <Text style={styles.infoValue}>
                {userData?.firstName} {userData?.lastName}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <FontAwesome name="calendar" size={16} color="#8a2be2" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>
                {userData?.age ? `${userData.age} años` : 'No especificado'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <FontAwesome name="music" size={16} color="#8a2be2" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Género favorito</Text>
              <Text style={styles.infoValue}>
                {userData?.favoriteGenre || 'No especificado'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <FontAwesome name="globe" size={16} color="#8a2be2" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>País</Text>
              <Text style={styles.infoValue}>
                {userData?.country || 'No especificado'}
              </Text>
            </View>
          </View>
        </View>

        {/* ESTADÍSTICAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <FontAwesome name="music" size={24} color="#8a2be2" />
              <Text style={styles.statNumber}>{songsCount}</Text>
              <Text style={styles.statLabel}>Canciones</Text>
            </View>

            <View style={styles.statItem}>
              <FontAwesome name="user" size={24} color="#8a2be2" />
              <Text style={styles.statNumber}>
                {userData?.accountType === 'Premium' ? 'Premium' : 'Free'}
              </Text>
              <Text style={styles.statLabel}>Tipo de cuenta</Text>
            </View>

            <View style={styles.statItem}>
              <FontAwesome name="calendar-check-o" size={24} color="#8a2be2" />
              <Text style={styles.statNumber}>
                {formatDate(userData?.createdAt)}
              </Text>
              <Text style={styles.statLabel}>Miembro desde</Text>
            </View>
          </View>
        </View>

        {/* ACCIONES RÁPIDAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Home')}
          >
            <FontAwesome name="home" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionText}>Ir a Biblioteca</Text>
            <FontAwesome name="chevron-right" size={16} color="#b0b0ff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddEditSong')}
          >
            <FontAwesome name="plus" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionText}>Agregar Canción</Text>
            <FontAwesome name="chevron-right" size={16} color="#b0b0ff" />
          </TouchableOpacity>

          {userData?.accountType === 'Free' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.premiumAction]}
              onPress={() => Alert.alert('Premium', 'Función premium próximamente disponible')}
            >
              <FontAwesome name="star" size={20} color="#ffd700" style={styles.actionIcon} />
              <Text style={[styles.actionText, styles.premiumText]}>Actualizar a Premium</Text>
              <FontAwesome name="chevron-right" size={16} color="#ffd700" />
            </TouchableOpacity>
          )}
        </View>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  accountTypeBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  accountTypeBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#b0b0ff',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8a2be2',
    marginBottom: 15,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 15,
  },
  infoIcon: {
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: '#b0b0ff',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#b0b0ff',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  premiumAction: {
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  actionIcon: {
    marginRight: 10,
  },
  actionText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumText: {
    color: '#ffd700',
  },
});

export default Profile;