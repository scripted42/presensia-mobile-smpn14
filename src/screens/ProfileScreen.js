import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Toast from '../components/Toast';
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
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  X,
} from 'lucide-react-native';

const ProfileScreen = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, isStudent, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Change Password state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordModalVisible(true);
  };

  const handleClosePasswordModal = () => {
    if (submittingPassword) return;
    setPasswordModalVisible(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      showToast('Masukkan kata sandi saat ini terlebih dahulu.', 'error');
      return;
    }
    if (!newPassword.trim()) {
      showToast('Masukkan kata sandi baru.', 'error');
      return;
    }
    if (newPassword.trim().length < 6) {
      showToast('Kata sandi baru minimal 6 karakter.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi kata sandi baru tidak cocok.', 'error');
      return;
    }

    setSubmittingPassword(true);
    try {
      const response = await client.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (response.data?.success) {
        setPasswordModalVisible(false);
        showToast(
          response.data?.message || 'Password berhasil diperbarui!',
          'success'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(response.data?.message || 'Gagal mengubah kata sandi.', 'error');
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.formattedMessage ||
        'Terjadi kesalahan saat mengubah kata sandi.';
      showToast(errorMsg, 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

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
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

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

        {/* Section 3: Keamanan & Akun */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Keamanan Akun</Text>
          </View>

          {/* Ganti Password Option */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleOpenPasswordModal}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
              <KeyRound size={16} color="#4F46E5" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.actionTitle}>Ubah Kata Sandi</Text>
              <Text style={styles.actionSub}>Ganti password default akun Anda</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

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

      {/* Modal Ubah Kata Sandi */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePasswordModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClosePasswordModal}
          />

          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalIconBadge}>
                  <Lock size={18} color="#2563EB" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>Ubah Kata Sandi</Text>
                  <Text style={styles.modalSubtitle}>Perbarui kata sandi akun Anda</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClosePasswordModal}
                style={styles.modalCloseBtn}
                disabled={submittingPassword}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Field 1: Current Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kata Sandi Saat Ini</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Masukkan kata sandi saat ini"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    autoCapitalize="none"
                    editable={!submittingPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 2: New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kata Sandi Baru</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                    editable={!submittingPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 3: Confirm New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Konfirmasi Kata Sandi Baru</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Ketik ulang kata sandi baru"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    editable={!submittingPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Security Hint */}
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>
                  💡 <Text style={{ fontWeight: '700' }}>Informasi:</Text> Jika sebelumnya Anda belum pernah mengganti password, kata sandi saat ini adalah password default Anda (misalnya: "password" atau NIK/NIS Anda).
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={handleClosePasswordModal}
                  disabled={submittingPassword}
                >
                  <Text style={styles.cancelModalBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveModalBtn, submittingPassword && { opacity: 0.7 }]}
                  onPress={handleChangePassword}
                  disabled={submittingPassword}
                  activeOpacity={0.85}
                >
                  {submittingPassword ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveModalBtnText}>Simpan Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  hintBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 2,
    marginBottom: 18,
  },
  hintText: {
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveModalBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveModalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
