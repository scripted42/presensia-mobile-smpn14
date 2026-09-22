import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  UserCheck,
  QrCode,
  LogOut,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';

const HomeScreen = ({ onNavigate }) => {
  const { user, logout, isStudent, isTeacher } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const response = await client.get('/attendance/today');
      if (response.data?.success) {
        setTodayAttendance(response.data.data?.attendance || null);
      }
    } catch (e) {
      console.log('[HomeScreen] Gagal memuat status absensi:', e?.response?.status, e?.message);
      if (e?.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodayStatus();
  };

  const getStatusBadge = () => {
    if (!todayAttendance) {
      return {
        label: 'Belum Absen',
        bg: '#FEF2F2',
        color: '#DC2626',
        icon: AlertTriangle,
      };
    }

    const st = todayAttendance.status?.toLowerCase();
    if (st === 'ontime' || st === 'present' || st === 'tepat_waktu') {
      return {
        label: 'Tepat Waktu',
        bg: '#ECFDF5',
        color: '#059669',
        icon: CheckCircle2,
      };
    } else if (st === 'late' || st === 'terlambat') {
      return {
        label: 'Terlambat',
        bg: '#FEF3C7',
        color: '#D97706',
        icon: Clock,
      };
    } else if (st === 'permission' || st === 'leave' || st === 'izin') {
      return {
        label: 'Izin',
        bg: '#EFF6FF',
        color: '#2563EB',
        icon: Calendar,
      };
    }
    return {
      label: todayAttendance.status || 'Hadir',
      bg: '#F1F5F9',
      color: '#475569',
      icon: CheckCircle2,
    };
  };

  const badge = getStatusBadge();
  const BadgeIcon = badge.icon;

  const todayDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Top Bar / Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Halo,</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Pengguna'}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>
                {isStudent ? 'Siswa' : (user?.user_type === 'employee' ? 'Guru / Pegawai' : 'Staff')}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <LogOut size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Date Bar */}
        <View style={styles.dateBar}>
          <Calendar size={14} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>{todayDateStr}</Text>
        </View>

        {/* Today's Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status Kehadiran Hari Ini</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <BadgeIcon size={12} color={badge.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color="#2563EB" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.attendanceRow}>
              {/* Check-in info */}
              <View style={styles.attendanceCol}>
                <Text style={styles.colLabel}>Jam Masuk</Text>
                <Text style={styles.colTime}>
                  {todayAttendance?.check_in
                    ? new Date(todayAttendance.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-- : --'}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Check-out info */}
              <View style={styles.attendanceCol}>
                <Text style={styles.colLabel}>Jam Pulang</Text>
                <Text style={styles.colTime}>
                  {todayAttendance?.check_out
                    ? new Date(todayAttendance.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-- : --'}
                </Text>
              </View>
            </View>
          )}

          {todayAttendance?.location_name ? (
            <View style={styles.locationContainer}>
              <Text style={styles.locationText} numberOfLines={1}>
                📍 {todayAttendance.location_name}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>

        <View style={styles.actionsGrid}>
          {/* Guru / Pegawai Actions */}
          {!isStudent && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
                onPress={() => onNavigate('check-in')}
                activeOpacity={0.85}
              >
                <View style={styles.actionIconCircle}>
                  <UserCheck size={22} color="#2563EB" />
                </View>
                <Text style={styles.actionBtnTitle}>Absensi Selfie</Text>
                <Text style={styles.actionBtnSub}>Kamera depan & GPS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                onPress={() => onNavigate('scan-student')}
                activeOpacity={0.85}
              >
                <View style={styles.actionIconCircle}>
                  <QrCode size={22} color="#059669" />
                </View>
                <Text style={styles.actionBtnTitle}>Scan QR Siswa</Text>
                <Text style={styles.actionBtnSub}>Absensi masal siswa</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Siswa Actions */}
          {isStudent && (
            <View style={styles.studentCard}>
              <QrCode size={36} color="#2563EB" style={{ marginBottom: 12 }} />
              <Text style={styles.studentCardTitle}>QR Code Siswa</Text>
              <Text style={styles.studentNisText}>NIS: {user?.nis || '-'}</Text>
              <Text style={styles.studentCardDesc}>
                Tunjukkan QR Code ini kepada guru piket / wali kelas saat tiba di sekolah untuk absensi harian.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginTop: 1,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  attendanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  colLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  colTime: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  locationContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionBtnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  actionBtnSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  studentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  studentCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  studentNisText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 10,
  },
  studentCardDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default HomeScreen;
