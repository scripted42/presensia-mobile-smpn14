import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Camera,
  LogOut,
  QrCode,
  Users,
  FileText,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react-native';

const QuickMenuGrid = ({ isStudent, onNavigate }) => {
  // Menu items for Guru / Pegawai
  const teacherMenus = [
    {
      id: 'check-in',
      title: 'Absen Masuk',
      sub: 'Selfie & QR',
      icon: Camera,
      color: '#2563EB',
      bg: '#EFF6FF',
      action: () => onNavigate('check-in'),
    },
    {
      id: 'check-out',
      title: 'Absen Pulang',
      sub: 'Selfie & QR',
      icon: LogOut,
      color: '#D97706',
      bg: '#FEF3C7',
      action: () => onNavigate('check-out'),
    },
    {
      id: 'scan-student',
      title: 'Scan QR Siswa',
      sub: 'Batch Presensi',
      icon: QrCode,
      color: '#059669',
      bg: '#ECFDF5',
      action: () => onNavigate('scan-student'),
    },
    {
      id: 'student-history',
      title: 'Riwayat Siswa',
      sub: 'Monitoring Kelas',
      icon: Users,
      color: '#4F46E5',
      bg: '#EEF2FF',
      action: () => onNavigate('student-history'),
    },
    {
      id: 'leave',
      title: 'Izin & Cuti',
      sub: 'Pengajuan & Verif',
      icon: FileText,
      color: '#7C3AED',
      bg: '#F5F3FF',
      action: () => onNavigate('leave'),
    },
    {
      id: 'history',
      title: 'Riwayat Saya',
      sub: 'Kalender Presensi',
      icon: Calendar,
      color: '#0F172A',
      bg: '#F1F5F9',
      action: () => onNavigate('history-tab'),
    },
  ];

  // Menu items for Siswa
  const studentMenus = [
    {
      id: 'student-qr',
      title: 'QR Code Saya',
      sub: 'Kartu Pelajar',
      icon: QrCode,
      color: '#2563EB',
      bg: '#EFF6FF',
      action: () => onNavigate('student-qr-modal'),
    },
    {
      id: 'leave',
      title: 'Izin / Sakit',
      sub: 'Surat Dokter',
      icon: FileText,
      color: '#7C3AED',
      bg: '#F5F3FF',
      action: () => onNavigate('leave'),
    },
    {
      id: 'history',
      title: 'Riwayat Absensi',
      sub: 'Rekap Kehadiran',
      icon: Calendar,
      color: '#059669',
      bg: '#ECFDF5',
      action: () => onNavigate('history-tab'),
    },
    {
      id: 'profile',
      title: 'Profil Siswa',
      sub: 'Data Diri & NIS',
      icon: User,
      color: '#0F172A',
      bg: '#F1F5F9',
      action: () => onNavigate('profile-tab'),
    },
  ];

  const activeMenus = isStudent ? studentMenus : teacherMenus;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Menu Cepat</Text>

      <View style={styles.grid}>
        {activeMenus.map((menu) => {
          const Icon = menu.icon;
          return (
            <TouchableOpacity
              key={menu.id}
              style={styles.menuItem}
              onPress={menu.action}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: menu.bg }]}>
                <Icon size={22} color={menu.color} />
              </View>
              <Text style={styles.menuTitle} numberOfLines={1}>
                {menu.title}
              </Text>
              <Text style={styles.menuSub} numberOfLines={1}>
                {menu.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  menuItem: {
    width: '31%', // 3 columns
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  menuSub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 1,
  },
});

export default QuickMenuGrid;
