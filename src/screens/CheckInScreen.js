import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import client from '../api/client';
import { ArrowLeft, Camera, RefreshCw, CheckCircle, MapPin, AlertCircle } from 'lucide-react-native';
import Toast from '../components/Toast';

const CheckInScreen = ({ onBack, onSuccess }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Mencari titik lokasi GPS...');
  const [facing, setFacing] = useState('front');
  const [photoUri, setPhotoUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const cameraRef = useRef(null);

  // Request location permission & fetch coordinates
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('Izin akses lokasi ditolak');
          setToast({ visible: true, message: 'Izin GPS diperlukan untuk absensi.', type: 'error' });
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc.coords);

        // Reverse geocoding
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverse && reverse.length > 0) {
          const r = reverse[0];
          const name = [r.street, r.district, r.subregion, r.city].filter(Boolean).join(', ');
          setLocationName(name || `Lat: ${loc.coords.latitude.toFixed(4)}, Lon: ${loc.coords.longitude.toFixed(4)}`);
        } else {
          setLocationName(`Koordinat: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        }
      } catch (e) {
        console.warn('Gagal membaca lokasi:', e);
        setLocationName('Gagal mendeteksi lokasi GPS');
      }
    })();
  }, []);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 12 }} />
        <Text style={styles.permTitle}>Izin Kamera Diperlukan</Text>
        <Text style={styles.permSub}>Aplikasi memerlukan akses kamera untuk foto selfie absensi.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleSnap = async () => {
    if (!cameraRef.current) return;
    try {
      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });
      setPhotoUri(pic.uri);
    } catch (e) {
      setToast({ visible: true, message: 'Gagal mengambil foto: ' + e.message, type: 'error' });
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
  };

  const handleSubmit = async () => {
    if (!photoUri) {
      setToast({ visible: true, message: 'Silakan ambil foto selfie terlebih dahulu.', type: 'warning' });
      return;
    }

    if (!location) {
      setToast({ visible: true, message: 'Lokasi GPS belum terdeteksi. Silakan coba lagi.', type: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('location_name', locationName || 'Lokasi GPS Mobile');

      const filename = photoUri.split('/').pop() || 'selfie.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: photoUri,
        name: filename,
        type,
      });

      const res = await client.post('/attendance/check-in', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setToast({ visible: true, message: res.data.message || 'Absensi berhasil dicatat!', type: 'success' });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onBack();
        }, 1500);
      } else {
        setToast({ visible: true, message: res.data?.message || 'Gagal menyimpan absensi', type: 'error' });
      }
    } catch (err) {
      setToast({
        visible: true,
        message: err.formattedMessage || err.response?.data?.message || 'Gagal mengirim absensi.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Absensi Selfie</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Viewport */}
      <View style={styles.viewport}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        ) : (
          <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
        )}

        {/* Location pill */}
        <View style={styles.locationPill}>
          <MapPin size={13} color="#2563EB" style={{ marginRight: 6 }} />
          <Text style={styles.locationPillText} numberOfLines={1}>
            {locationName}
          </Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        {photoUri ? (
          <View style={styles.submitRow}>
            <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} disabled={submitting}>
              <RefreshCw size={18} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.retakeBtnText}>Ulangi</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CheckCircle size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>Kirim Absensi</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.captureRow}>
            <TouchableOpacity
              style={styles.switchCamBtn}
              onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
            >
              <RefreshCw size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.snapBtn} onPress={handleSnap} activeOpacity={0.8}>
              <View style={styles.snapBtnInner}>
                <Camera size={26} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={{ width: 44 }} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewport: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 16,
    position: 'relative',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  locationPill: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  locationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  bottomBar: {
    padding: 24,
    alignItems: 'center',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  switchCamBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  snapBtnInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retakeBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  permTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  permSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#64748B',
    fontSize: 13,
  },
});

export default CheckInScreen;
