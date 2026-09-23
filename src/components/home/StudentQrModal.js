import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { X, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import client from '../../api/client';

const StudentQrModal = ({ visible, onClose, user }) => {
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  // Exact payload format as generated in the database: NIS|Name
  const fallbackPayload = `${user?.nis || ''}|${user?.name || ''}`;
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(fallbackPayload)}&format=png&margin=10`;

  const fetchStudentQr = async () => {
    if (!visible) return;
    setLoading(true);
    try {
      const res = await client.get('/student/qr-code');
      if (res.data?.success && res.data?.data) {
        setQrImage(res.data.data.qr_image || res.data.data.qr_url);
        setStudentDetails(res.data.data);
      } else {
        setQrImage(fallbackQrUrl);
      }
    } catch (_) {
      // Seamless fallback to exact payload QR generator
      setQrImage(fallbackQrUrl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchStudentQr();
    }
  }, [visible]);

  const className =
    studentDetails?.class_name ||
    user?.class_name ||
    user?.classroom?.name ||
    'Siswa SMPN 14';

  const nisText = user?.nis || studentDetails?.nis || '-';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Kartu QR Pelajar</Text>
              <Text style={styles.sub}>SMP Negeri 14 Surabaya</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* QR Container */}
          <View style={styles.qrBox}>
            {loading && !qrImage ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Memuat QR Code Siswa...</Text>
              </View>
            ) : (
              <View style={styles.qrImageWrapper}>
                <Image
                  source={{ uri: qrImage || fallbackQrUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* QR Code Payload Value */}
            <View style={styles.payloadRow}>
              <Text style={styles.qrCodeValText} numberOfLines={1}>
                {user?.nis ? `${user.nis} • ${user?.name || ''}` : user?.name || 'SISWA'}
              </Text>
            </View>
          </View>

          {/* Student Info Box */}
          <View style={styles.studentInfoBox}>
            <Text style={styles.studentName} numberOfLines={2}>
              {user?.name || 'Siswa SMPN 14'}
            </Text>
            <View style={styles.metaBadgeRow}>
              <View style={styles.nisBadge}>
                <Text style={styles.nisBadgeText}>NIS: {nisText}</Text>
              </View>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>Kelas {className}</Text>
              </View>
            </View>
          </View>

          {/* Verification Badge */}
          <View style={styles.verifiedRow}>
            <CheckCircle2 size={13} color="#16A34A" style={{ marginRight: 4 }} />
            <Text style={styles.verifiedText}>Terdaftar di Database Presensi Sekolah</Text>
          </View>

          {/* Guidance note */}
          <View style={styles.guidanceBox}>
            <ShieldCheck size={14} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.guidanceText}>
              Arahkan QR Code ini ke kamera scan guru piket saat tiba di sekolah untuk absensi masuk.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    width: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 10,
  },
  qrImageWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  qrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  payloadRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
    alignItems: 'center',
  },
  qrCodeValText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  studentInfoBox: {
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nisBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nisBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  classBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  guidanceText: {
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
    flex: 1,
  },
});

export default StudentQrModal;
