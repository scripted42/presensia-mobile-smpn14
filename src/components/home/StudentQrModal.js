import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { QrCode, X, ShieldCheck } from 'lucide-react-native';

const StudentQrModal = ({ visible, onClose, user }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Kartu QR Pelajar</Text>
              <Text style={styles.sub}>SMP Negeri 14 Surabaya</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* QR Container */}
          <View style={styles.qrBox}>
            <QrCode size={180} color="#1E3A8A" />
            <Text style={styles.qrCodeValText}>{user?.nis || user?.id || 'SISWA'}</Text>
          </View>

          {/* Student Info Box */}
          <View style={styles.studentInfoBox}>
            <Text style={styles.studentName} numberOfLines={1}>{user?.name || 'Siswa'}</Text>
            <Text style={styles.studentNis}>NIS: {user?.nis || '-'}</Text>
          </View>

          {/* Guidance note */}
          <View style={styles.guidanceBox}>
            <ShieldCheck size={14} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.guidanceText}>
              Tunjukkan QR Code ini kepada guru piket / wali kelas saat tiba di sekolah untuk absensi masuk.
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    width: '100%',
  },
  qrCodeValText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 10,
    letterSpacing: 1,
  },
  studentInfoBox: {
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  studentNis: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
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
