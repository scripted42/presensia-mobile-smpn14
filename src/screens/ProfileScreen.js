import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Hash,
  School,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  MapPin,
  Sparkles,
} from 'lucide-react-native';

const ProfileScreen = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, isStudent, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (refreshUser) {
        await refreshUser();
      }
    } catch (_) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari akun Presensia?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  // Extract initials
  const initials = (user?.name || 'Pengguna')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Determine user role label
  const getRoleLabel = () => {
    if (isStudent) {
      return user?.class_name || user?.classroom?.name
        ? `Siswa • Kelas ${user?.class_name || user?.classroom?.name}`
        : 'Siswa / Peserta Didik';
    }
    if (user?.role === 'admin' || user?.user_type === 'admin') {
      return 'Administrator Sekolah';
    }
    return 'Guru / Tenaga Pendidik';
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER BAR (Unified App Format) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle}>Profil Saya</Text>
          <Text style={styles.topBarSub}>Informasi Akun & Pengaturan</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* 2. SCROLLABLE PROFILE CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />
        }
      >
        {/* Profile Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
            <View style={styles.statusDotRing}>
              <CheckCircle2 size={16} color="#10B981" />
            </View>
          </View>

          <Text style={styles.userName} numberOfLines={2}>
            {user?.name || 'Pengguna Presensia'}
          </Text>

          <View style={styles.roleBadge}>
            <Sparkles size={13} color="#2563EB" style={{ marginRight: 5 }} />
            <Text style={styles.roleText}>{getRoleLabel()}</Text>
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Akun Aktif & Terverifikasi</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Data Pribadi & Identitas */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Identitas Akun</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <User size={16} color="#2563EB" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nama Lengkap</Text>
              <Text style={styles.infoValue}>{user?.name || '-'}</Text>
            </View>
          </View>

          {isStudent && (
            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <Hash size={16} color="#2563EB" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nomor Induk Siswa (NIS)</Text>
                <Text style={styles.infoValue}>{user?.nis || '-'}</Text>
              </View>
            </View>
          )}

          {!isStudent && user?.nip && (
            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <Hash size={16} color="#2563EB" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nomor Induk Pegawai (NIP)</Text>
                <Text style={styles.infoValue}>{user.nip}</Text>
              </View>
            </View>
          )}

          {user?.nik ? (
            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <Hash size={16} color="#2563EB" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nomor Induk Kependudukan (NIK)</Text>
                <Text style={styles.infoValue}>{user.nik}</Text>
              </View>
            </View>
          ) : null}

          {isStudent ? (
            <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
              <View style={styles.iconBox}>
                <GraduationCap size={16} color="#2563EB" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Rombel / Kelas</Text>
                <Text style={styles.infoValue}>
                  {user?.class_name || user?.classroom?.name || 'Siswa SMPN 14'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
              <View style={styles.iconBox}>
                <Briefcase size={16} color="#2563EB" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Peran Pengguna</Text>
                <Text style={styles.infoValue}>
                  {user?.role === 'admin' ? 'Administrator' : 'Guru / Tenaga Kependidikan'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Section 2: Kontak & Sekolah */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kontak & Instansi</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Mail size={16} color="#2563EB" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Alamat Email</Text>
              <Text style={styles.infoValue}>{user?.email || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Phone size={16} color="#2563EB" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nomor Telepon / WhatsApp</Text>
              <Text style={styles.infoValue}>{user?.phone || user?.phone_number || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <School size={16} color="#2563EB" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Instansi Pendidikan</Text>
              <Text style={styles.infoValue}>SMP Negeri 14 Surabaya</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
            <View style={styles.iconBox}>
              <MapPin size={16} color="#2563EB" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Kota / Wilayah</Text>
              <Text style={styles.infoValue}>Kota Surabaya, Jawa Timur</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Keamanan & Logout */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Keamanan Akun</Text>
          </View>

          <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <ShieldCheck size={16} color="#15803D" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Status Keamanan Sesi</Text>
              <Text style={styles.infoValue}>Terenkripsi & Login Biometrik Aktif</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
        </TouchableOpacity>

        {/* Footer Application Metadata */}
        <View style={styles.appFooter}>
          <Text style={styles.versionTitle}>Presensia Mobile • Native Edition</Text>
          <Text style={styles.versionSub}>Versi 1.0.0 • SMP Negeri 14 Surabaya</Text>
        </View>
      </ScrollView>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  statusDotRing: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 10,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
  appFooter: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  versionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  versionSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
});

export default ProfileScreen;
