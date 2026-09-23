import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

// Reusable Modular Home Components
import HomeHeader from '../components/home/HomeHeader';
import HighlightCard from '../components/home/HighlightCard';
import StatCardsSection from '../components/home/StatCardsSection';
import QuickMenuGrid from '../components/home/QuickMenuGrid';
import ActivitySection from '../components/home/ActivitySection';
import StudentQrModal from '../components/home/StudentQrModal';

const HomeScreen = ({ onNavigate, refreshTrigger }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, isStudent } = useAuth();

  // Data states
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [hasPendingNotification, setHasPendingNotification] = useState(false);

  // Loading states
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Student QR Modal
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // Month Name
  const currentMonthName = new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  // Fetch all home data concurrently
  const fetchHomeData = useCallback(async () => {
    // 1. Fetch Today Status
    const pToday = client
      .get('/attendance/today')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          const att = d.attendance || (d.has_checked_in ? {
            check_in: d.check_in || d.check_in_time,
            check_out: d.check_out || d.check_out_time,
            status: d.status,
            status_label: d.status_label,
            location_name: d.location_name,
            photo_url: d.photo_url,
          } : null);
          setTodayAttendance(att);
        } else {
          setTodayAttendance(null);
        }
      })
      .catch((e) => {
        console.log('[HomeScreen] Gagal memuat status hari ini:', e?.message);
        if (e?.response?.status === 401) {
          logout();
        }
      })
      .finally(() => setLoadingToday(false));

    // 2. Fetch Monthly Summary & Activities
    const now = new Date();
    const pStats = client
      .get('/reports/monthly', {
        params: { month: now.getMonth() + 1, year: now.getFullYear() },
      })
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setStatistics(res.data.data.statistics || null);
          setRecentActivities(res.data.data.attendances || []);
        }
      })
      .catch((e) => {
        console.log('[HomeScreen] Gagal memuat statistik bulanan:', e?.message);
      })
      .finally(() => setLoadingStats(false));

    // 3. Check for pending notifications / leave approvals
    const pLeaves = client
      .get('/leave-requests')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const count = res.data.data.pending_approvals_count || 0;
          setHasPendingNotification(count > 0);
        }
      })
      .catch((e) => {
        // Silently catch leave request errors
      });

    await Promise.allSettled([pToday, pStats, pLeaves]);
    setRefreshing(false);
  }, [logout]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData, refreshTrigger]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleNotificationPress = () => {
    if (hasPendingNotification) {
      onNavigate('leave');
    } else {
      Alert.alert(
        'Notifikasi',
        'Tidak ada notifikasi baru saat ini. Seluruh status absensi dan permohonan telah diperbarui.'
      );
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. HEADER AREA */}
      <HomeHeader
        user={user}
        isStudent={isStudent}
        insets={insets}
        onLogout={logout}
        onNotificationPress={handleNotificationPress}
        hasUnreadNotification={hasPendingNotification}
      />

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* 2. HIGHLIGHT CARD (Jam Digital & Status Absen & Tombol Utama) */}
        <HighlightCard
          todayAttendance={todayAttendance}
          isStudent={isStudent}
          loading={loadingToday}
          onCheckInPress={() => onNavigate('check-in')}
          onCheckOutPress={() => onNavigate('check-out')}
          onStudentQrPress={() => setQrModalVisible(true)}
        />

        {/* 3. MENU CEPAT SECTION (Grid 3 Kolom Role-Based) */}
        <QuickMenuGrid
          isStudent={isStudent}
          onNavigate={(screen) => {
            if (screen === 'student-qr-modal') {
              setQrModalVisible(true);
            } else {
              onNavigate(screen);
            }
          }}
        />

        {/* 4. STATISTIK SECTION (4 Stat Cards Bulanan + Skeleton) */}
        <StatCardsSection
          stats={statistics}
          loading={loadingStats}
          monthName={currentMonthName}
        />

        {/* 5. RIWAYAT / AKTIVITAS SECTION (Daftar Aktivitas Terakhir + Lihat Semua) */}
        <ActivitySection
          activities={recentActivities}
          loading={loadingStats}
          onViewAllPress={() => onNavigate('history-tab')}
        />
      </ScrollView>

      {/* Modal Kartu QR Siswa */}
      <StudentQrModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        user={user}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 30,
  },
});

export default HomeScreen;
