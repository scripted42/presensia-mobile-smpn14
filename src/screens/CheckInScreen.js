import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import client from '../api/client';
import {
  ArrowLeft,
  ArrowRight,
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
  Scan,
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
  const insets = useSafeAreaInsets();
  const [currentMode, setCurrentMode] = useState(mode); // 'check-in' or 'check-out'
  const [activeStep, setActiveStep] = useState('selfie'); // 'selfie' | 'qr'

  // Location & School Data
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Mendeteksi GPS...');
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);

  // Camera & Permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraKey, setCameraKey] = useState(0);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

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
      console.log('Error fetching location:', e?.message);
      setLocationName('Gagal mengambil titik GPS');
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchLocation();
  }, [fetchSettings, fetchLocation]);

  // 3. Verify Radius to School
  useEffect(() => {
    if (!location || !schoolSettings) return;

    const schoolLat = parseFloat(schoolSettings.latitude);
    const schoolLon = parseFloat(schoolSettings.longitude);
    const radiusMeters = parseInt(schoolSettings.radius_meters || 100, 10);

    if (isNaN(schoolLat) || isNaN(schoolLon)) {
      setIsWithinRadius(true);
      return;
    }

    const dist = calculateDistanceInMeters(
      location.latitude,
      location.longitude,
      schoolLat,
      schoolLon
    );

    setDistanceMeters(dist);

    if (schoolSettings.require_location) {
      setIsWithinRadius(dist <= radiusMeters);
    } else {
      setIsWithinRadius(true);
    }
  }, [location, schoolSettings]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 12 }} />
        <Text style={styles.permTitle}>Izin Kamera Diperlukan</Text>
        <Text style={styles.permSub}>
          Aplikasi memerlukan izin akses kamera untuk mengambil foto selfie dan memindai QR Code di layar sekolah.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle Capture Selfie Photo
  const handleSnap = async () => {
    if (!cameraRef.current || takingPhoto) return;
    setTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        setPhotoUri(photo.uri);
        const actionLabel = currentMode === 'check-in' ? 'Masuk' : 'Pulang';
        setToast({
          visible: true,
          message: `✓ Foto selfie ${actionLabel} berhasil diambil!`,
          type: 'success',
        });
        // Beri jeda 400ms agar hardware kamera Android menyelesaikan capture sebelum beralih ke QR
        setTimeout(() => {
          setActiveStep('qr');
        }, 400);
      }
    } catch (e) {
      console.log('Error takePicture:', e?.message);
      setToast({ visible: true, message: 'Gagal mengambil foto selfie.', type: 'error' });
    } finally {
      setTakingPhoto(false);
    }
  };

  // Handle QR Code Scanned from TV Screen (display-qr)
  const handleBarcodeScanned = ({ data }) => {
    if (!data || activeStep !== 'qr' || scannedQr) return;

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
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* 1. TOP HEADER (Standard App Format) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle}>
            {currentMode === 'check-in' ? 'Absensi Masuk' : 'Absensi Pulang'}
          </Text>
          <Text style={styles.topBarSub}>Foto Selfie & Scan QR Layar TV</Text>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            setCameraKey((k) => k + 1);
            setToast({ visible: true, message: 'Sensor kamera dimuat ulang', type: 'info' });
          }}
          activeOpacity={0.7}
        >
          <RefreshCw size={17} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* 2. MODE SELECTOR PILLS (Masuk vs Pulang) */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeTab, currentMode === 'check-in' && styles.modeTabActiveCheckIn]}
          onPress={() => switchMode('check-in')}
        >
          <UserCheck size={16} color={currentMode === 'check-in' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 6 }} />
          <Text style={[styles.modeTabText, currentMode === 'check-in' && styles.modeTabTextActive]}>
            Absen Masuk
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, currentMode === 'check-out' && styles.modeTabActiveCheckOut]}
          onPress={() => switchMode('check-out')}
        >
          <LogOut size={16} color={currentMode === 'check-out' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 6 }} />
          <Text style={[styles.modeTabText, currentMode === 'check-out' && styles.modeTabTextActive]}>
            Absen Pulang
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. GPS RADIUS BANNER CARD */}
      <View style={styles.gpsCard}>
        <View style={styles.gpsRow}>
          <MapPin size={16} color={isWithinRadius ? '#10B981' : '#EF4444'} style={{ marginRight: 6 }} />
          <Text style={styles.gpsTitle} numberOfLines={1}>
            {locationName}
          </Text>
          <TouchableOpacity onPress={fetchLocation} style={styles.gpsRefreshBtn}>
            <RefreshCw size={13} color="#2563EB" />
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

      {/* 4. STEP TABS (1. Selfie | 2. Scan QR Layar) */}
      <View style={styles.stepTabs}>
        <TouchableOpacity
          style={[styles.stepBtn, activeStep === 'selfie' && styles.stepBtnActive]}
          onPress={() => setActiveStep('selfie')}
        >
          <View style={[styles.stepNum, photoUri ? styles.stepNumDone : null]}>
            {photoUri ? <Check size={12} color="#FFFFFF" /> : <Text style={styles.stepNumText}>1</Text>}
          </View>
          <Text style={[styles.stepBtnText, activeStep === 'selfie' && styles.stepBtnTextActive]}>
            Selfie {currentMode === 'check-in' ? 'Masuk' : 'Pulang'} {photoUri ? '✓' : ''}
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

      {/* 5. CAMERA VIEWPORT */}
      <View style={styles.viewport}>
        {/* The SINGLE Persistent Camera View - Facing switches reactively without unmounting/destroying surface */}
        <CameraView
          key={`cam-${cameraKey}`}
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={activeStep === 'selfie' ? 'front' : 'back'}
          barcodeScannerSettings={
            activeStep === 'qr' && !scannedQr ? { barcodeTypes: ['qr'] } : undefined
          }
          onBarcodeScanned={
            activeStep === 'qr' && !scannedQr ? handleBarcodeScanned : undefined
          }
          onCameraReady={() => setCameraReady(true)}
        />

        {/* OVERLAY 1: Photo Preview (when activeStep === 'selfie' and photoUri is present) */}
        {activeStep === 'selfie' && photoUri && (
          <View style={StyleSheet.absoluteFill}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <View style={styles.previewOverlay}>
              <View style={styles.doneBadge}>
                <CheckCircle2 size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.doneBadgeText}>
                  Foto Selfie {currentMode === 'check-in' ? 'Masuk' : 'Pulang'} Tersimpan
                </Text>
              </View>
              <View style={styles.previewBtnRow}>
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => setPhotoUri(null)}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.retakeBtnText}>Ambil Ulang</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nextStepBtn}
                  onPress={() => setActiveStep('qr')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextStepBtnText}>Lanjut Scan QR</Text>
                  <ArrowRight size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* OVERLAY 2: Selfie Active Guide & Shutter (when activeStep === 'selfie' and no photo yet) */}
        {activeStep === 'selfie' && !photoUri && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Face Oval Guide Overlay */}
            <View style={styles.faceOverlay} pointerEvents="none">
              <View style={styles.faceOval} />
              <Text style={styles.faceHint}>
                Posisikan wajah Anda pada oval untuk foto absen {currentMode === 'check-in' ? 'masuk' : 'pulang'}
              </Text>
            </View>
            {/* Shutter Button */}
            <View style={styles.shutterContainer}>
              <TouchableOpacity
                style={[styles.shutterOuter, takingPhoto && { opacity: 0.5 }]}
                onPress={handleSnap}
                disabled={takingPhoto}
                activeOpacity={0.8}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* OVERLAY 3: QR Scanner Viewfinder Guide (when activeStep === 'qr' and not yet scanned) */}
        {activeStep === 'qr' && !scannedQr && (
          <View style={styles.qrOverlay} pointerEvents="none">
            <View style={styles.qrFrame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <Text style={styles.qrHint}>
              Arahkan kamera ke QR Code dinamis pada layar TV lobby sekolah
            </Text>
          </View>
        )}

        {/* OVERLAY 4: QR Detected Success Screen (when activeStep === 'qr' and scannedQr is present) */}
        {activeStep === 'qr' && scannedQr && (
          <View style={styles.qrDoneContainer}>
            <CheckCircle2 size={54} color="#10B981" style={{ marginBottom: 12 }} />
            <Text style={styles.qrDoneTitle}>QR Layar Sekolah Terdeteksi!</Text>
            <Text style={styles.qrDoneSub} numberOfLines={2}>
              Kode: {scannedQr.substring(0, 20)}...
            </Text>
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => setScannedQr(null)}
              activeOpacity={0.8}
            >
              <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.rescanBtnText}>Scan Ulang QR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 6. BOTTOM ACTION CONTAINER (Respecting insets.bottom) */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {/* Verification Checklist */}
        <View style={styles.checklistRow}>
          <View style={styles.checkItem}>
            {photoUri ? <CheckCircle2 size={14} color="#10B981" /> : <AlertCircle size={14} color="#94A3B8" />}
            <Text style={[styles.checkText, photoUri && styles.checkTextDone]}>1. Selfie</Text>
          </View>
          <View style={styles.checkItem}>
            {scannedQr ? <CheckCircle2 size={14} color="#10B981" /> : <AlertCircle size={14} color="#94A3B8" />}
            <Text style={[styles.checkText, scannedQr && styles.checkTextDone]}>2. QR Layar</Text>
          </View>
          <View style={styles.checkItem}>
            {isWithinRadius ? <CheckCircle2 size={14} color="#10B981" /> : <AlertCircle size={14} color="#EF4444" />}
            <Text style={[styles.checkText, isWithinRadius ? styles.checkTextDone : styles.checkTextFail]}>3. Radius</Text>
          </View>
        </View>

        {/* Primary Submit Button */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  permSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
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
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleCol: {
    alignItems: 'center',
  },
  topBarTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  topBarSub: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
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
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gpsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  gpsRefreshBtn: {
    padding: 4,
  },
  radiusRow: {
    marginTop: 4,
  },
  radiusBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  radiusOk: {
    color: '#059669',
  },
  radiusFail: {
    color: '#DC2626',
  },
  radiusLoading: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
  },
  stepTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  stepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  stepNumDone: {
    backgroundColor: '#10B981',
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stepBtnTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  viewport: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  doneBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  previewBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  nextStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  nextStepBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  faceOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: 220,
    height: 300,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  faceHint: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  shutterOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
  },
  qrDoneContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrDoneTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
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
    paddingVertical: 10,
    borderRadius: 12,
  },
  rescanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFrame: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#10B981',
  },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  qrHint: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 240,
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginTop: 10,
  },
  checklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
    fontWeight: '600',
  },
  checkTextDone: {
    color: '#059669',
  },
  checkTextFail: {
    color: '#DC2626',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnCheckOut: {
    backgroundColor: '#D97706',
    shadowColor: '#D97706',
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default CheckInScreen;
