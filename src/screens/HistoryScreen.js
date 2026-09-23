import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../api/client';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  UserCheck,
  MapPin,
  X,
  Camera,
  FileText,
  Percent,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

const YEARS = [2024, 2025, 2026, 2027];

// Clean formatting helpers for date & time
const formatDateClean = (dateVal, formattedVal) => {
  if (formattedVal && typeof formattedVal === 'string' && !formattedVal.includes('T')) {
    return formattedVal;
  }
  if (!dateVal) return '-';
  const str = String(dateVal).trim();
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch (_) {}
  return str.substring(0, 10);
};

const formatTimeClean = (val) => {
  if (!val) return '-- : --';
  const str = String(val).trim();
  const isoMatch = str.match(/T(\d{2}):(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}:${isoMatch[2]}`;
  }
  const timeMatch = str.match(/^(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  } catch (_) {}
  return str.substring(0, 5);
};

// Generate calendar matrix for Model 2 (Dot Matrix Heatmap)
const generateCalendarMatrix = (month, year, attendancesList) => {
  const attendanceMap = {};
  (attendancesList || []).forEach((item) => {
    if (!item.date) return;
    const dateKey = String(item.date).substring(0, 10);
    attendanceMap[dateKey] = item;
  });

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month, 0).getDate();

  const weeks = [];
  let currentWeek = [null, null, null, null, null]; // [Sen, Sel, Rab, Kam, Jum]

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const colIndex = dayOfWeek - 1;
      let status = 'UPCOMING';
      let item = attendanceMap[dateKey];

      if (dateKey > todayStr) {
        status = 'UPCOMING';
      } else if (item) {
        const s = (item.status || '').toLowerCase();
        if (s === 'ontime') status = 'ONTIME';
        else if (s === 'late') status = 'LATE';
        else if (['sick', 'permit', 'leave', 'duty'].includes(s)) status = 'PERMIT';
        else status = 'ALPHA';
      } else {
        status = 'NO_DATA';
      }

      currentWeek[colIndex] = { day, dateKey, status, item };

      if (dayOfWeek === 5 || day === daysInMonth) {
        weeks.push([...currentWeek]);
        currentWeek = [null, null, null, null, null];
      }
    }
  }

  if (currentWeek.some(Boolean)) {
    weeks.push(currentWeek);
  }

  return weeks;
};

const HistoryScreen = ({ onBack }) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [pickerVisible, setPickerVisible] = useState(false);
  const [tempMonth, setTempMonth] = useState(today.getMonth() + 1);
  const [tempYear, setTempYear] = useState(today.getFullYear());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ONTIME' | 'LATE' | 'OTHER'

  // Photo viewer modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);

  // Fetch report for selected month & year
  const fetchMonthlyReport = useCallback(async (m, y) => {
    try {
      setLoading(true);
      const res = await client.get('/reports/monthly', {
        params: { month: m, year: y },
      });

      if (res.data?.success && res.data?.data) {
        setReportData(res.data.data);
      }
    } catch (e) {
      console.log('Gagal memuat rekap bulanan:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthlyReport(selectedMonth, selectedYear);
  }, [fetchMonthlyReport, selectedMonth, selectedYear]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMonthlyReport(selectedMonth, selectedYear);
  };

  // Month navigation: previous month
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  // Month navigation: next month
  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Apply custom period from modal
  const applyPicker = () => {
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setPickerVisible(false);
  };

  // Statistics calculation helpers
  const stats = reportData?.statistics || {
    total_days: 30,
    working_days: 22,
    total_masuk: 0,
    ontime_days: 0,
    late_days: 0,
    sick_days: 0,
    permit_days: 0,
    leave_days: 0,
    absent_days: 0,
    attendance_percentage: 0,
  };

  const weeklyChart = reportData?.weekly_chart || [];
  const attendances = reportData?.attendances || [];

  // Generate calendar matrix for Model 2 (Matriks Presensi Harian)
  const calendarMatrix = useMemo(() => {
    return generateCalendarMatrix(selectedMonth, selectedYear, attendances);
  }, [selectedMonth, selectedYear, attendances]);

  // Filtered attendance list based on selected chip
  const filteredAttendances = useMemo(() => {
    if (filterStatus === 'ONTIME') {
      return attendances.filter((item) => item.status === 'ontime');
    }
    if (filterStatus === 'LATE') {
      return attendances.filter((item) => item.status === 'late');
    }
    if (filterStatus === 'OTHER') {
      return attendances.filter((item) => ['sick', 'permit', 'leave', 'duty', 'alpha'].includes(item.status));
    }
    return attendances;
  }, [attendances, filterStatus]);

  const formatStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'ontime' || s === 'present' || s === 'tepat_waktu') {
      return { label: 'Tepat Waktu', color: '#059669', bg: '#ECFDF5', dot: '#10B981' };
    }
    if (s === 'late' || s === 'terlambat') {
      return { label: 'Terlambat', color: '#D97706', bg: '#FEF3C7', dot: '#F59E0B' };
    }
    if (s === 'sick' || s === 'sakit') {
      return { label: 'Sakit', color: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' };
    }
    if (s === 'permit' || s === 'izin') {
      return { label: 'Izin', color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' };
    }
    if (s === 'leave' || s === 'duty' || s === 'cuti' || s === 'dinas') {
      return { label: 'Cuti / Dinas', color: '#0284C7', bg: '#F0F9FF', dot: '#0EA5E9' };
    }
    return { label: 'Alpha', color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' };
  };

  // Header Component for FlatList (Stats + Chart + Filters)
  const renderListHeader = () => {
    const totalMasuk = stats.total_masuk ?? stats.present_days ?? 0;
    const workingDays = Math.round(Number(stats.working_days || stats.total_days || 22));
    const ontimeCount = stats.ontime_days ?? 0;
    const lateCount = stats.late_days ?? 0;
    const otherCount = (stats.sick_days || 0) + (stats.permit_days || 0) + (stats.leave_days || 0);

    return (
      <View style={styles.headerContainer}>
        {/* 1. Main KPI Card (Total Masuk & Percentage) */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTopRow}>
            <View>
              <Text style={styles.kpiLabel}>Total Masuk Pegawai</Text>
              <View style={styles.kpiValueRow}>
                <Text style={styles.kpiMainNumber}>{totalMasuk}</Text>
                <Text style={styles.kpiTotalDays}> / {workingDays} Hari Efektif</Text>
              </View>
            </View>
            <View style={styles.percentageBadge}>
              <TrendingUp size={16} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={styles.percentageText}>{stats.attendance_percentage}%</Text>
            </View>
          </View>

          {/* Attendance Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, Math.max(0, stats.attendance_percentage))}%` },
              ]}
            />
          </View>
        </View>

        {/* 2. Grid of 3 Specific KPI Cards */}
        <View style={styles.statsGrid}>
          {/* Tepat Waktu */}
          <View style={[styles.statBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <View style={styles.statIconBadgeGreen}>
              <CheckCircle2 size={16} color="#059669" />
            </View>
            <Text style={[styles.statCount, { color: '#065F46' }]}>{ontimeCount}</Text>
            <Text style={[styles.statTitle, { color: '#047857' }]}>Tepat Waktu</Text>
          </View>

          {/* Terlambat */}
          <View style={[styles.statBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <View style={styles.statIconBadgeOrange}>
              <Clock size={16} color="#D97706" />
            </View>
            <Text style={[styles.statCount, { color: '#92400E' }]}>{lateCount}</Text>
            <Text style={[styles.statTitle, { color: '#B45309' }]}>Terlambat</Text>
          </View>

          {/* Izin / Sakit */}
          <View style={[styles.statBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <View style={styles.statIconBadgeBlue}>
              <Calendar size={16} color="#2563EB" />
            </View>
            <Text style={[styles.statCount, { color: '#1E40AF' }]}>{otherCount}</Text>
            <Text style={[styles.statTitle, { color: '#1D4ED8' }]}>Izin / Sakit</Text>
          </View>
        </View>

      {/* 3. Matriks Presensi Harian (Dot Matrix Calendar Heatmap - Model 2) */}
      <View style={styles.chartCard}>
        <View style={styles.matrixHeader}>
          <View>
            <Text style={styles.chartTitle}>Matriks Presensi Harian</Text>
            <Text style={styles.chartSub}>
              Peta kehadiran hari kerja (Senin - Jumat)
            </Text>
          </View>
          <View style={styles.matrixMonthPill}>
            <Text style={styles.matrixMonthText}>
              {MONTH_SHORT[selectedMonth - 1]} {selectedYear}
            </Text>
          </View>
        </View>

        {/* Days of Week Header */}
        <View style={styles.matrixDaysHeaderRow}>
          <View style={styles.matrixWeekColHeader}>
            <Text style={styles.matrixWeekLabelHeader}>Minggu</Text>
          </View>
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum'].map((dName, i) => (
            <View key={i} style={styles.matrixDayHeaderCell}>
              <Text style={styles.matrixDayHeaderText}>{dName}</Text>
            </View>
          ))}
        </View>

        {/* Matrix Rows (Weeks 1-5) */}
        <View style={styles.matrixGridContainer}>
          {calendarMatrix.map((week, wIdx) => (
            <View key={wIdx} style={styles.matrixWeekRow}>
              {/* Week Label */}
              <View style={styles.matrixWeekCol}>
                <Text style={styles.matrixWeekColText}>Mg {wIdx + 1}</Text>
              </View>

              {/* 5 Day Cells */}
              {week.map((cell, cIdx) => {
                if (!cell) {
                  return (
                    <View key={cIdx} style={styles.matrixCellContainer}>
                      <View style={styles.matrixDotEmpty} />
                    </View>
                  );
                }

                let dotStyle = styles.matrixDotUpcoming;
                let textStyle = styles.matrixDotTextUpcoming;

                if (cell.status === 'ONTIME') {
                  dotStyle = styles.matrixDotOntime;
                  textStyle = styles.matrixDotTextActive;
                } else if (cell.status === 'LATE') {
                  dotStyle = styles.matrixDotLate;
                  textStyle = styles.matrixDotTextActive;
                } else if (cell.status === 'PERMIT') {
                  dotStyle = styles.matrixDotPermit;
                  textStyle = styles.matrixDotTextActive;
                } else if (cell.status === 'ALPHA') {
                  dotStyle = styles.matrixDotAlpha;
                  textStyle = styles.matrixDotTextActive;
                } else if (cell.status === 'NO_DATA') {
                  dotStyle = styles.matrixDotNoData;
                  textStyle = styles.matrixDotTextNoData;
                }

                return (
                  <View key={cIdx} style={styles.matrixCellContainer}>
                    <View style={[styles.matrixDotBase, dotStyle]}>
                      <Text style={[styles.matrixDotTextBase, textStyle]}>{cell.day}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Matrix Legends */}
        <View style={styles.matrixLegendsRow}>
          <View style={styles.matrixLegendItem}>
            <View style={[styles.matrixLegendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.matrixLegendText}>Tepat</Text>
          </View>
          <View style={styles.matrixLegendItem}>
            <View style={[styles.matrixLegendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.matrixLegendText}>Terlambat</Text>
          </View>
          <View style={styles.matrixLegendItem}>
            <View style={[styles.matrixLegendDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.matrixLegendText}>Izin/Sakit</Text>
          </View>
          <View style={styles.matrixLegendItem}>
            <View style={[styles.matrixLegendDot, { backgroundColor: '#CBD5E1' }]} />
            <Text style={styles.matrixLegendText}>Mendatang</Text>
          </View>
        </View>
      </View>

      {/* 4. Filter Chips */}
      <View style={styles.filterSection}>
        <Text style={styles.filterHeaderTitle}>Daftar Riwayat Presensi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          <TouchableOpacity
            style={[styles.chip, filterStatus === 'ALL' && styles.chipActive]}
            onPress={() => setFilterStatus('ALL')}
          >
            <Text style={[styles.chipText, filterStatus === 'ALL' && styles.chipTextActive]}>
              Semua ({attendances.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStatus === 'ONTIME' && styles.chipActiveGreen]}
            onPress={() => setFilterStatus('ONTIME')}
          >
            <Text style={[styles.chipText, filterStatus === 'ONTIME' && styles.chipTextActiveGreen]}>
              Tepat Waktu ({stats.ontime_days})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStatus === 'LATE' && styles.chipActiveOrange]}
            onPress={() => setFilterStatus('LATE')}
          >
            <Text style={[styles.chipText, filterStatus === 'LATE' && styles.chipTextActiveOrange]}>
              Terlambat ({stats.late_days})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStatus === 'OTHER' && styles.chipActiveBlue]}
            onPress={() => setFilterStatus('OTHER')}
          >
            <Text style={[styles.chipText, filterStatus === 'OTHER' && styles.chipTextActiveBlue]}>
              Izin / Sakit ({(stats.sick_days || 0) + (stats.permit_days || 0)})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.topBarTitle}>Riwayat & Analitik</Text>
          <Text style={styles.topBarSub}>Rekapitulasi Kehadiran Pegawai</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Period Navigator Bar (< September 2026 >) */}
      <View style={styles.periodBar}>
        <TouchableOpacity style={styles.periodNavBtn} onPress={handlePrevMonth}>
          <ChevronLeft size={20} color="#2563EB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.periodCapsule} onPress={() => setPickerVisible(true)}>
          <Calendar size={15} color="#2563EB" style={{ marginRight: 6 }} />
          <Text style={styles.periodCapsuleText}>
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </Text>
          <ChevronDown size={15} color="#64748B" style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.periodNavBtn} onPress={handleNextMonth}>
          <ChevronRight size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Loading or Main Content */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#2563EB" size="large" />
          <Text style={styles.loadingText}>Memuat statistik absensi...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAttendances}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={44} color="#CBD5E1" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>Tidak Ada Catatan</Text>
              <Text style={styles.emptySub}>
                Tidak ditemukan catatan absensi pada periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                {filterStatus !== 'ALL' ? ' dengan filter yang dipilih.' : '.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = formatStatusBadge(item.status);

            return (
              <View style={styles.attendanceCard}>
                {/* Card Top: Date & Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.dateBadgeContainer}>
                    <Calendar size={14} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.dateFullText}>
                      {formatDateClean(item.date, item.date_formatted)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Card Times Row (Masuk & Pulang) */}
                <View style={styles.timesContainer}>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeBoxLabel}>Jam Masuk</Text>
                    <View style={styles.timeValRow}>
                      <Clock size={14} color="#059669" style={{ marginRight: 4 }} />
                      <Text style={[styles.timeValText, item.check_in ? { color: '#0F172A' } : { color: '#94A3B8' }]}>
                        {formatTimeClean(item.check_in)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timeDivider} />

                  <View style={styles.timeBox}>
                    <Text style={styles.timeBoxLabel}>Jam Pulang</Text>
                    <View style={styles.timeValRow}>
                      <Clock size={14} color="#D97706" style={{ marginRight: 4 }} />
                      <Text style={[styles.timeValText, item.check_out ? { color: '#0F172A' } : { color: '#94A3B8' }]}>
                        {formatTimeClean(item.check_out)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Footer: GPS Location & Selfie Photo Thumbnail */}
                <View style={styles.cardFooter}>
                  {item.location_name ? (
                    <View style={styles.locationRow}>
                      <MapPin size={12} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {item.location_name}
                      </Text>
                    </View>
                  ) : <View style={{ flex: 1 }} />}

                  {/* Photo Preview Thumbnail */}
                  {item.photo_url && (
                    <TouchableOpacity
                      style={styles.photoThumbBtn}
                      onPress={() => setPreviewPhotoUrl(item.photo_url)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: item.photo_url }} style={styles.photoThumbImg} />
                      <View style={styles.cameraIconOverlay}>
                        <Camera size={10} color="#FFFFFF" />
                      </View>
                      <Text style={styles.photoThumbLabel}>Lihat Foto</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Notes if present */}
                {item.notes ? (
                  <View style={styles.notesContainer}>
                    <FileText size={12} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}

      {/* Month & Year Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Periode Absensi</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Year Selector Chips */}
            <Text style={styles.modalSectionLabel}>Tahun</Text>
            <View style={styles.yearRow}>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearBtn, tempYear === y && styles.yearBtnActive]}
                  onPress={() => setTempYear(y)}
                >
                  <Text style={[styles.yearBtnText, tempYear === y && styles.yearBtnTextActive]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Month Selector Grid */}
            <Text style={styles.modalSectionLabel}>Bulan</Text>
            <View style={styles.monthsGrid}>
              {MONTH_SHORT.map((name, idx) => {
                const monthNum = idx + 1;
                const isSelected = tempMonth === monthNum;
                return (
                  <TouchableOpacity
                    key={monthNum}
                    style={[styles.monthBtn, isSelected && styles.monthBtnActive]}
                    onPress={() => setTempMonth(monthNum)}
                  >
                    <Text style={[styles.monthBtnText, isSelected && styles.monthBtnTextActive]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.applyBtn} onPress={applyPicker}>
              <Text style={styles.applyBtnText}>Terapkan Periode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Selfie Photo Preview Modal */}
      <Modal visible={!!previewPhotoUrl} transparent animationType="fade">
        <View style={styles.photoModalBackdrop}>
          <TouchableOpacity style={styles.photoModalClose} onPress={() => setPreviewPhotoUrl(null)}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {previewPhotoUrl && (
            <View style={styles.photoModalWrapper}>
              <Image source={{ uri: previewPhotoUrl }} style={styles.photoFullImage} resizeMode="contain" />
              <Text style={styles.photoModalCaption}>Foto Selfie Bukti Presensi</Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
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
  topBarTitleContainer: {
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
  },
  periodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  periodNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodCapsuleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 40,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  kpiMainNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiTotalDays: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  percentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconBadgeGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statIconBadgeOrange: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statIconBadgeBlue: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statCount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 10,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartSub: {
    fontSize: 11,
    color: '#64748B',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  matrixMonthPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  matrixMonthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  matrixDaysHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  matrixWeekColHeader: {
    width: 46,
  },
  matrixWeekLabelHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  matrixDayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  matrixDayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  matrixGridContainer: {
    gap: 8,
  },
  matrixWeekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matrixWeekCol: {
    width: 46,
  },
  matrixWeekColText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  matrixCellContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixDotBase: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixDotEmpty: {
    width: 32,
    height: 32,
  },
  matrixDotOntime: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  matrixDotLate: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  matrixDotPermit: {
    backgroundColor: '#8B5CF6',
  },
  matrixDotAlpha: {
    backgroundColor: '#EF4444',
  },
  matrixDotNoData: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  matrixDotUpcoming: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  matrixDotTextBase: {
    fontSize: 12,
    fontWeight: '700',
  },
  matrixDotTextActive: {
    color: '#FFFFFF',
  },
  matrixDotTextNoData: {
    color: '#94A3B8',
  },
  matrixDotTextUpcoming: {
    color: '#CBD5E1',
  },
  matrixLegendsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  matrixLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matrixLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  matrixLegendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  filterSection: {
    marginTop: 6,
    marginBottom: 4,
  },
  filterHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  filterScrollView: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipActiveGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipActiveOrange: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  chipActiveBlue: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextActiveGreen: {
    color: '#FFFFFF',
  },
  chipTextActiveOrange: {
    color: '#FFFFFF',
  },
  chipTextActiveBlue: {
    color: '#FFFFFF',
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateFullText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timesContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeBoxLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  timeValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValText: {
    fontSize: 15,
    fontWeight: '800',
  },
  timeDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
  },
  photoThumbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  photoThumbImg: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 6,
  },
  cameraIconOverlay: {
    position: 'absolute',
    left: 10,
    top: 6,
  },
  photoThumbLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  notesText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  yearRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  yearBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  yearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  yearBtnTextActive: {
    color: '#FFFFFF',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  monthBtn: {
    width: (SCREEN_WIDTH - 40 - 40 - 24) / 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  monthBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  monthBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  photoModalClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  photoModalWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  photoFullImage: {
    width: '100%',
    height: 420,
    borderRadius: 16,
  },
  photoModalCaption: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
  },
});

export default HistoryScreen;
