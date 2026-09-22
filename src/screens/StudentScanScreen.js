import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import client from '../api/client';
import { ArrowLeft, Flashlight, Trash2, Send, CheckCircle2, Users, AlertCircle } from 'lucide-react-native';
import Toast from '../components/Toast';

const StudentScanScreen = ({ onBack }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedList, setScannedList] = useState([]);
  const [torch, setTorch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const lastScannedTimeRef = useRef(0);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 12 }} />
        <Text style={styles.permTitle}>Izin Kamera Diperlukan</Text>
        <Text style={styles.permSub}>Aplikasi memerlukan akses kamera untuk memindai QR Code siswa.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = ({ data }) => {
    if (!isScanningActive || !data) return;

    // Debounce scan events within 1.5 seconds
    const now = Date.now();
    if (now - lastScannedTimeRef.current < 1500) return;
    lastScannedTimeRef.current = now;

    // Check if already in current scan queue
    if (scannedList.some((item) => item.code === data)) {
      setToast({ visible: true, message: 'QR Siswa ini sudah masuk dalam daftar antrean.', type: 'warning' });
      return;
    }

    // Parse display label
    let displayName = data;
    if (data.includes('|')) {
      const parts = data.split('|');
      displayName = `${parts[1]} (${parts[0]})`;
    } else if (data.includes('_')) {
      const parts = data.split('_');
      displayName = `${parts[1]} (${parts[0]})`;
    }

    const newItem = {
      id: Date.now().toString(),
      code: data,
      name: displayName,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setScannedList((prev) => [newItem, ...prev]);
    setToast({ visible: true, message: `✓ Terbaca: ${displayName}`, type: 'success' });
  };

  const handleRemove = (id) => {
    setScannedList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setScannedList([]);
  };

  const handleSyncAttendance = async () => {
    if (scannedList.length === 0) {
      setToast({ visible: true, message: 'Belum ada QR siswa yang dipindai.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const qrCodes = scannedList.map((item) => item.code);
      const res = await client.post('/attendance/scan-student', { qr_codes: qrCodes });

      if (res.data?.success) {
        const msg = res.data.message || `${qrCodes.length} siswa berhasil diabsen!`;
        setToast({ visible: true, message: msg, type: 'success' });
        setScannedList([]); // Clear queue on success
      } else {
        setToast({ visible: true, message: res.data?.message || 'Gagal menyimpan absensi masal.', type: 'error' });
      }
    } catch (e) {
      setToast({
        visible: true,
        message: e.formattedMessage || e.response?.data?.message || 'Gagal mengirim data absensi.',
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
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Scan QR Siswa Masal</Text>
        <TouchableOpacity
          style={[styles.iconBtn, torch && styles.iconBtnActive]}
          onPress={() => setTorch(!torch)}
        >
          <Flashlight size={20} color={torch ? '#F59E0B' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {/* Camera Scanner Viewport */}
      <View style={styles.cameraBox}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        >
          {/* QR Viewfinder Target Frame */}
          <View style={styles.overlayCenter}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <Text style={styles.hintText}>Arahkan kamera ke QR Code kartu siswa</Text>
          </View>
        </CameraView>
      </View>

      {/* Scanned Queue Sheet */}
      <View style={styles.queueSheet}>
        <View style={styles.queueHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Users size={16} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.queueTitle}>Antrean Siswa ({scannedList.length})</Text>
          </View>
          {scannedList.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} disabled={submitting}>
              <Text style={styles.clearText}>Kosongkan</Text>
            </TouchableOpacity>
          )}
        </View>

        {scannedList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Belum ada siswa yang dipindai.</Text>
            <Text style={styles.emptySub}>Arahkan kamera ke QR Code siswa untuk mulai absensi.</Text>
          </View>
        ) : (
          <FlatList
            data={scannedList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.studentItem}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.studentTime}>Waktu: {item.time}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemove(item.id)}>
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {/* Sync Button */}
        {scannedList.length > 0 && (
          <TouchableOpacity
            style={[styles.syncBtn, submitting && styles.syncBtnDisabled]}
            onPress={handleSyncAttendance}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnInner}>
                <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.syncBtnText}>Kirim Absensi ({scannedList.length} Siswa)</Text>
              </View>
            )}
          </TouchableOpacity>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(245,158,11,0.25)',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraBox: {
    height: 280,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlayCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  frame: {
    width: 190,
    height: 190,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#3B82F6',
    borderWidth: 4,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  hintText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  queueSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 14,
    padding: 18,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  listContent: {
    paddingBottom: 10,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  studentTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  syncBtn: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  syncBtnDisabled: {
    opacity: 0.65,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
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

export default StudentScanScreen;
