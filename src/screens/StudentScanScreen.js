import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '../api/client';
import {
  ArrowLeft,
  Flashlight,
  Trash2,
  Send,
  Users,
  AlertCircle,
  QrCode,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import Toast from '../components/Toast';

const StudentScanScreen = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedList, setScannedList] = useState([]);
  const [torch, setTorch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const lastScannedTimeRef = useRef(0);

  if (!permission) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.permIconCircle}>
          <AlertCircle size={44} color="#EF4444" />
        </View>
        <Text style={styles.permTitle}>Izin Kamera Diperlukan</Text>
        <Text style={styles.permSub}>
          Aplikasi memerlukan akses kamera untuk memindai kartu QR Code siswa secara cepat.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Izinkan Akses Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
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
      setToast({
        visible: true,
        message: 'QR Siswa ini sudah masuk dalam antrean pemindaian.',
        type: 'warning',
      });
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
        const msg = res.data.message || `${qrCodes.length} presensi siswa berhasil dicatat!`;
        setToast({ visible: true, message: msg, type: 'success' });
        setScannedList([]); // Clear queue on success
      } else {
        const errMsg = res.data?.message || 'Gagal menyimpan absensi masal.';
        setToast({ visible: true, message: errMsg, type: 'error' });
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.formattedMessage || 'Gagal mengirim data absensi.';
      setToast({
        visible: true,
        message: errMsg,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* 1. TOP HEADER BAR (Unified App Standard) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle}>Scan QR Siswa</Text>
          <Text style={styles.topBarSub}>Pemindaian Massal Presensi Siswa</Text>
        </View>

        <TouchableOpacity
          style={[styles.flashBtn, torch && styles.flashBtnActive]}
          onPress={() => setTorch(!torch)}
          activeOpacity={0.7}
        >
          <Flashlight size={18} color={torch ? '#D97706' : '#64748B'} />
        </TouchableOpacity>
      </View>

      {/* 2. CAMERA SCANNER VIEWPORT */}
      <View style={styles.cameraWrapper}>
        <View style={styles.cameraBox}>
          <CameraView
            style={styles.cameraFill}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />

          {/* Viewfinder Target Frame Overlay */}
          <View style={styles.overlayCenter} pointerEvents="none">
            <View style={styles.frame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <View style={styles.hintPill}>
              <QrCode size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.hintText}>Arahkan kamera ke QR Code kartu siswa</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. SCANNED QUEUE LIST CONTAINER */}
      <View style={styles.queueSheet}>
        <View style={styles.queueHeader}>
          <View style={styles.queueTitleRow}>
            <View style={styles.queueBadgeIcon}>
              <Users size={15} color="#2563EB" />
            </View>
            <Text style={styles.queueTitle}>
              Antrean Siswa
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{scannedList.length}</Text>
            </View>
          </View>

          {scannedList.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} disabled={submitting} activeOpacity={0.7}>
              <Text style={styles.clearText}>Kosongkan</Text>
            </TouchableOpacity>
          )}
        </View>

        {scannedList.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <QrCode size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyText}>Belum Ada Siswa Dipindai</Text>
            <Text style={styles.emptySub}>
              Dekatkan kartu QR siswa ke dalam bingkai kamera di atas untuk mencatat kehadiran.
            </Text>
          </View>
        ) : (
          <FlatList
            data={scannedList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={5}
            renderItem={({ item, index }) => (
              <View style={styles.studentItem}>
                <View style={styles.itemIndexCircle}>
                  <Text style={styles.itemIndexText}>{scannedList.length - index}</Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.timeRow}>
                    <Clock size={11} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.studentTime}>Pukul {item.time}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemove(item.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {/* 4. SUBMIT / SYNC BUTTON (Safe Bottom Insets) */}
        {scannedList.length > 0 && (
          <View style={[styles.actionFooter, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <TouchableOpacity
              style={[styles.syncBtn, submitting && styles.syncBtnDisabled]}
              onPress={handleSyncAttendance}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <View style={styles.btnInner}>
                  <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.syncBtnText}>Menyimpan Presensi...</Text>
                </View>
              ) : (
                <View style={styles.btnInner}>
                  <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.syncBtnText}>
                    Kirim Presensi ({scannedList.length} Siswa)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  topBarSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  flashBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  cameraWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  cameraBox: {
    flex: 1,
    minHeight: 380,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cameraFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  frame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#3B82F6',
    borderWidth: 4,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },
  hintPill: {
    position: 'absolute',
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  queueSheet: {
    maxHeight: 250,
    minHeight: 180,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueBadgeIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    marginLeft: 8,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  listContent: {
    paddingBottom: 12,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  studentTime: {
    fontSize: 11,
    color: '#64748B',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  actionFooter: {
    paddingTop: 10,
  },
  syncBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  syncBtnDisabled: {
    opacity: 0.6,
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
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  permIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    lineHeight: 19,
    marginBottom: 24,
    maxWidth: 280,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
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
    fontWeight: '600',
  },
});

export default StudentScanScreen;
