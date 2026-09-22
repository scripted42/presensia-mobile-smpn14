import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import {
  ArrowLeft,
  Camera,
  RefreshCw,
  CheckCircle2,
  MapPin,
  AlertCircle,
  QrCode,
  Check,
  Send,
  UserCheck,
  LogOut,
} from 'lucide-react-native';
import Toast from '../components/Toast';

// Haversine distance calculator in meters
function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const CheckInScreen = ({ mode = 'check-in', onBack, onSuccess }) => {
  const [currentMode, setCurrentMode] = useState(mode); // 'check-in' | 'check-out'
  const [activeStep, setActiveStep] = useState('selfie'); // 'selfie' | 'qr'
  const [permission, requestPermission] = useCameraPermissions();

  // Location & Settings
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Mendeteksi GPS...');
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(true);

  // Media & Inputs
  const [photoUri, setPhotoUri] = useState(null);
  const [scannedQr, setScannedQr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const cameraRef = useRef(null);
  const lastQrTimeRef = useRef(0);

  // Synchronize and reset state whenever mode prop changes
  useEffect(() => {
    setCurrentMode(mode);
    setPhotoUri(null);
    setScannedQr(null);
    setActiveStep('selfie');
  }, [mode]);

  // Handle switching between Absen Masuk and Absen Pulang
  const switchMode = (newMode) => {
    if (newMode === currentMode) return;
    setCurrentMode(newMode);
    setPhotoUri(null);
    setScannedQr(null);
    setActiveStep('selfie');
  };

  // 1. Fetch School Attendance Settings (Radius, Coordinates)
  const fetchSettings = useCallback(async () => {
    try {
      const res = await client.get('/settings/attendance');
      if (res.data?.success && res.data?.data) {
        setSchoolSettings(res.data.data);
      }
    } catch (e) {
      console.log('Gagal memuat pengaturan radius sekolah:', e?.message);
    }
  }, []);

  // 2. Fetch Location Coordinates
  const fetchLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Izin akses GPS ditolak');
        setToast({ visible: true, message: 'Izin GPS diperlukan untuk validasi absensi.', type: 'error' });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);

      // Reverse geocoding for friendly display
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverse && reverse.length > 0) {
          const r = reverse[0];
          const name = [r.street, r.district, r.city].filter(Boolean).join(', ');
          setLocationName(name || `Lat: ${loc.coords.latitude.toFixed(4)}, Lon: ${loc.coords.longitude.toFixed(4)}`);
        }
      } catch (_) {
        setLocationName(`Lat: ${loc.coords.latitude.toFixed(4)}, Lon: ${loc.coords.longitude.toFixed(4)}`);
      }
    } catch (e) {
      console.log('Gagal membaca GPS:', e?.message);
      setLocationName('Gagal mendeteksi lokasi GPS');
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchLocation();
  }, [fetchSettings, fetchLocation]);

  // 3. Calculate distance whenever location or school settings update
  useEffect(() => {
    if (location && schoolSettings?.location_latitude && schoolSettings?.location_longitude) {
      const sLat = parseFloat(schoolSettings.location_latitude);
      const sLon = parseFloat(schoolSettings.location_longitude);
      const maxRadius = schoolSettings.radius_meters || 100;

      const dist = calculateDistanceInMeters(location.latitude, location.longitude, sLat, sLon);
      setDistanceMeters(dist);

      if (schoolSettings.require_location) {
        setIsWithinRadius(dist <= maxRadius);
      } else {
        setIsWithinRadius(true);
      }
    }
  }, [location, schoolSettings]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 12 }} />
        <Text style={styles.permTitle}>Izin Kamera Diperlukan</Text>
        <Text style={styles.permSub}>
          Aplikasi memerlukan izin kamera untuk foto selfie dan memindai QR Code di layar sekolah.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Handle Photo Snap (Selfie)
  const handleSnap = async () => {
    if (!cameraRef.current) return;
    try {
      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: false,
      });
      setPhotoUri(pic.uri);
      setToast({
        visible: true,
        message: `✓ Foto selfie ${currentMode === 'check-in' ? 'masuk' : 'pulang'} berhasil diambil!`,
        type: 'success',
      });

      // Automatically advance to QR step if not yet scanned
      if (!scannedQr) {
        setTimeout(() => {
          setActiveStep('qr');
        }, 600);
      }
    } catch (e) {
      setToast({ visible: true, message: 'Gagal mengambil foto: ' + e.message, type: 'error' });
    }
  };

  // Handle QR Code Scanned from TV Screen (display-qr)
  const handleBarcodeScanned = ({ data }) => {
    if (!data || activeStep !== 'qr') return;

    const now = Date.now();
    if (now - lastQrTimeRef.current < 2000) return;
    lastQrTimeRef.current = now;

    setScannedQr(data);
    setToast({ visible: true, message: '✓ QR Code Layar Sekolah Terdeteksi!', type: 'success' });
  };

  // Handle Submit Attendance
  const handleSubmit = async () => {
    if (!photoUri) {
      setActiveStep('selfie');
      setToast({ visible: true, message: 'Silakan ambil foto selfie terlebih dahulu (Langkah 1).', type: 'warning' });
      return;
    }

    if (!scannedQr) {
      setActiveStep('qr');
      setToast({ visible: true, message: 'Silakan scan QR Code di layar sekolah terlebih dahulu (Langkah 2).', type: 'warning' });
      return;
    }

    if (!location) {
      setToast({ visible: true, message: 'Lokasi GPS belum terdeteksi. Silakan coba lagi.', type: 'warning' });
      return;
    }

    if (!isWithinRadius && schoolSettings?.require_location) {
      setToast({
        visible: true,
        message: `Anda di luar radius sekolah (${distanceMeters}m dari batas ${schoolSettings.radius_meters}m). Absensi tidak dapat diproses.`,
        type: 'error',
      });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('location_name', locationName || 'Lokasi Mobile');
      formData.append('qr_code', scannedQr);

      const filename = photoUri.split('/').pop() || 'selfie.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: photoUri,
        name: filename,
        type,
      });

      const endpoint = currentMode === 'check-in' ? '/attendance/check-in' : '/attendance/check-out';
      const res = await client.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        const actionLabel = currentMode === 'check-in' ? 'Absen Masuk' : 'Absen Pulang';
        setToast({ visible: true, message: `✓ ${actionLabel} berhasil dicatat!`, type: 'success' });
        // Clear media states to ensure next attendance starts completely fresh
        setPhotoUri(null);
        setScannedQr(null);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onBack();
        }, 1500);
      } else {
        setToast({ visible: true, message: res.data?.message || 'Gagal menyimpan absensi', type: 'error' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.formattedMessage || 'Gagal mengirim absensi.';
      setToast({
        visible: true,
        message: errMsg,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormComplete = photoUri && scannedQr && location && isWithinRadius;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {currentMode === 'check-in' ? 'Absensi Masuk Pegawai' : 'Absensi Pulang Pegawai'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode Selector (Masuk / Pulang) */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeTab, currentMode === 'check-in' && styles.modeTabActiveCheckIn]}
          onPress={() => switchMode('check-in')}
        >
          <UserCheck size={16} color={currentMode === 'check-in' ? '#FFFFFF' : '#94A3B8'} style={{ marginRight: 6 }} />
          <Text style={[styles.modeTabText, currentMode === 'check-in' && styles.modeTabTextActive]}>Absen Masuk</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, currentMode === 'check-out' && styles.modeTabActiveCheckOut]}
          onPress={() => switchMode('check-out')}
        >
          <LogOut size={16} color={currentMode === 'check-out' ? '#FFFFFF' : '#94A3B8'} style={{ marginRight: 6 }} />
          <Text style={[styles.modeTabText, currentMode === 'check-out' && styles.modeTabTextActive]}>Absen Pulang</Text>
        </TouchableOpacity>
      </View>

      {/* GPS Radius Status Banner */}
      <View style={styles.gpsBanner}>
        <View style={styles.gpsRow}>
          <MapPin size={16} color={isWithinRadius ? '#10B981' : '#EF4444'} style={{ marginRight: 6 }} />
          <Text style={styles.gpsTitle} numberOfLines={1}>
            {locationName}
          </Text>
          <TouchableOpacity onPress={fetchLocation} style={{ marginLeft: 6 }}>
            <RefreshCw size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        <View style={styles.radiusRow}>
          {distanceMeters !== null ? (
            <Text style={[styles.radiusBadge, isWithinRadius ? styles.radiusOk : styles.radiusFail]}>
              {isWithinRadius
                ? `✓ Dalam Radius (${distanceMeters}m dari sekolah)`
                : `⚠ Di Luar Radius (${distanceMeters}m / batas: ${schoolSettings?.radius_meters || 100}m)`}
            </Text>
          ) : (
            <Text style={styles.radiusLoading}>Menghitung jarak ke sekolah...</Text>
          )}
        </View>
      </View>

      {/* Stepper Tabs: 1. Selfie | 2. Scan QR Layar */}
      <View style={styles.stepTabs}>
        <TouchableOpacity
          style={[styles.stepBtn, activeStep === 'selfie' && styles.stepBtnActive]}
          onPress={() => setActiveStep('selfie')}
        >
          <View style={[styles.stepNum, photoUri ? styles.stepNumDone : null]}>
            {photoUri ? <Check size={12} color="#FFFFFF" /> : <Text style={styles.stepNumText}>1</Text>}
          </View>
          <Text style={[styles.stepBtnText, activeStep === 'selfie' && styles.stepBtnTextActive]}>
            Foto Selfie {currentMode === 'check-in' ? 'Masuk' : 'Pulang'} {photoUri ? '✓' : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepBtn, activeStep === 'qr' && styles.stepBtnActive]}
          onPress={() => setActiveStep('qr')}
        >
          <View style={[styles.stepNum, scannedQr ? styles.stepNumDone : null]}>
            {scannedQr ? <Check size={12} color="#FFFFFF" /> : <Text style={styles.stepNumText}>2</Text>}
          </View>
          <Text style={[styles.stepBtnText, activeStep === 'qr' && styles.stepBtnTextActive]}>
            Scan QR Layar {scannedQr ? '✓' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Viewport */}
      <View style={styles.viewport}>
        {/* STEP 1: SELFIE CAMERA */}
        {activeStep === 'selfie' && (
          <View style={StyleSheet.absoluteFill}>
            {photoUri ? (
              <View style={StyleSheet.absoluteFill}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                <View style={styles.previewOverlay}>
                  <View style={styles.doneBadge}>
                    <CheckCircle2 size={16} color="#10B981" style={{ marginRight: 6 }} />
                    <Text style={styles.doneBadgeText}>
                      Foto Selfie {currentMode === 'check-in' ? 'Masuk' : 'Pulang'} Berhasil Diambil
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhotoUri(null)}>
                    <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.retakeBtnText}>Ambil Ulang Foto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={StyleSheet.absoluteFill}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
                {/* Face Oval Guide Overlay */}
                <View style={styles.faceOverlay} pointerEvents="none">
                  <View style={styles.faceOval} />
                  <Text style={styles.faceHint}>
                    Posisikan wajah Anda untuk foto absen {currentMode === 'check-in' ? 'masuk' : 'pulang'}
                  </Text>
                </View>
                {/* Shutter Button */}
                <View style={styles.shutterContainer}>
                  <TouchableOpacity style={styles.shutterOuter} onPress={handleSnap}>
                    <View style={styles.shutterInner} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* STEP 2: QR SCANNER (From display-qr TV) */}
        {activeStep === 'qr' && (
          <View style={StyleSheet.absoluteFill}>
            {scannedQr ? (
              <View style={[styles.center, { backgroundColor: '#0F172A', padding: 24 }]}>
                <CheckCircle2 size={54} color="#10B981" style={{ marginBottom: 12 }} />
                <Text style={styles.qrDoneTitle}>QR Layar Sekolah Terdeteksi!</Text>
                <Text style={styles.qrDoneSub} numberOfLines={2}>
                  Kode: {scannedQr.substring(0, 16)}...
                </Text>
                <TouchableOpacity style={styles.rescanBtn} onPress={() => setScannedQr(null)}>
                  <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.rescanBtnText}>Scan Ulang QR</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={StyleSheet.absoluteFill}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={handleBarcodeScanned}
                />
                {/* Viewfinder Target Frame Overlay */}
                <View style={styles.qrOverlay} pointerEvents="none">
                  <View style={styles.qrFrame}>
                    <View style={[styles.corner, styles.tl]} />
                    <View style={[styles.corner, styles.tr]} />
                    <View style={[styles.corner, styles.bl]} />
                    <View style={[styles.corner, styles.br]} />
                  </View>
                  <Text style={styles.qrHint}>Arahkan kamera ke QR Code di layar TV monitor sekolah</Text>
                  <Text style={styles.qrSubHint}>(presensia.smpn14-surabaya.sch.id/attendance/display-qr)</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Bottom Summary & Submit Action */}
      <View style={styles.bottomBar}>
        <View style={styles.checklistRow}>
          <View style={styles.checkItem}>
            <CheckCircle2 size={14} color={photoUri ? '#10B981' : '#64748B'} style={{ marginRight: 4 }} />
            <Text style={[styles.checkText, photoUri && styles.checkTextDone]}>
              1. Selfie {currentMode === 'check-in' ? 'Masuk' : 'Pulang'}
            </Text>
          </View>
          <View style={styles.checkItem}>
            <CheckCircle2 size={14} color={scannedQr ? '#10B981' : '#64748B'} style={{ marginRight: 4 }} />
            <Text style={[styles.checkText, scannedQr && styles.checkTextDone]}>2. QR Layar</Text>
          </View>
          <View style={styles.checkItem}>
            <CheckCircle2 size={14} color={isWithinRadius ? '#10B981' : '#EF4444'} style={{ marginRight: 4 }} />
            <Text style={[styles.checkText, isWithinRadius ? styles.checkTextDone : styles.checkTextFail]}>
              3. Radius GPS
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            currentMode === 'check-out' && styles.submitBtnCheckOut,
            (!isFormComplete || submitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormComplete || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.btnInner}>
              <Send size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>
                {!photoUri
                  ? currentMode === 'check-in'
                    ? 'Ambil Selfie Masuk Dulu (1)'
                    : 'Ambil Selfie Pulang Dulu (1)'
                  : !scannedQr
                  ? 'Scan QR Layar Sekolah Dulu (2)'
                  : !isWithinRadius
                  ? 'Di Luar Radius Sekolah'
                  : currentMode === 'check-in'
                  ? 'Kirim Absen Masuk Sekarang'
                  : 'Kirim Absen Pulang Sekarang'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  permSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabActiveCheckIn: {
    backgroundColor: '#2563EB',
  },
  modeTabActiveCheckOut: {
    backgroundColor: '#D97706',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  gpsBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gpsTitle: {
    color: '#E2E8F0',
    fontSize: 11,
    flex: 1,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  radiusOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
  },
  radiusFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
  },
  radiusLoading: {
    fontSize: 11,
    color: '#94A3B8',
  },
  stepTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  stepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepBtnActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderColor: '#2563EB',
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  stepNumDone: {
    backgroundColor: '#10B981',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  stepBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  stepBtnTextActive: {
    color: '#FFFFFF',
  },
  viewport: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
  },
  doneBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  faceOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: 210,
    height: 270,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderStyle: 'dashed',
  },
  faceHint: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  shutterInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#3B82F6',
    borderWidth: 4,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  qrHint: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    textAlign: 'center',
  },
  qrSubHint: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },
  qrDoneTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  qrDoneSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 16,
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  rescanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  checkTextDone: {
    color: '#10B981',
    fontWeight: '600',
  },
  checkTextFail: {
    color: '#EF4444',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnCheckOut: {
    backgroundColor: '#D97706',
  },
  submitBtnDisabled: {
    backgroundColor: '#334155',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CheckInScreen;
