import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import client from '../api/client';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Filter,
  X,
  Camera,
  FileText,
  TrendingUp,
} from 'lucide-react-native';

const StudentHistoryScreen = ({ onBack }) => {
  // Date state (default today: YYYY-MM-DD)
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [dateFormatted, setDateFormatted] = useState('');

  // Class list & selected class
  const [classesList, setClassesList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('all');

  // Search query & status chip filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ontime' | 'late' | 'permit' | 'alpha'

  // Data & loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState({
    total_students: 0,
    present_count: 0,
    ontime_count: 0,
    late_count: 0,
    sick_count: 0,
    permit_count: 0,
    alpha_count: 0,
    attendance_rate: 0,
  });

  // Photo modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);

  // Fetch classes once
  const fetchClasses = useCallback(async () => {
    try {
      const res = await client.get('/attendance/classes');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setClassesList(res.data.data);
      }
    } catch (e) {
      console.log('Gagal memuat daftar kelas:', e?.message);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Fetch student history from API
  const fetchStudentHistory = useCallback(async (dateVal, classVal) => {
    try {
      setLoading(true);
      const params = { date: dateVal };
      if (classVal && classVal !== 'all') {
        params.class_id = classVal;
      }

      const res = await client.get('/attendance/students-history', { params });
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setStudents(data.students || []);
        if (data.statistics) {
          setStatistics(data.statistics);
        }
        if (data.date_formatted) {
          setDateFormatted(data.date_formatted);
        }
      }
    } catch (e) {
      console.log('Gagal memuat riwayat siswa:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentHistory(selectedDate, selectedClassId);
  }, [fetchStudentHistory, selectedDate, selectedClassId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudentHistory(selectedDate, selectedClassId);
  };

  // Date navigation helpers
  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const handleJumpToday = () => {
    setSelectedDate(getTodayStr());
  };

  const isToday = selectedDate === getTodayStr();

  // Filter students by search query and status chip
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'ontime') {
        list = list.filter((s) => s.status === 'ontime');
      } else if (statusFilter === 'late') {
        list = list.filter((s) => s.status === 'late');
      } else if (statusFilter === 'permit') {
        list = list.filter((s) => ['sick', 'permit'].includes(s.status));
      } else if (statusFilter === 'alpha') {
        list = list.filter((s) => s.status === 'alpha');
      }
    }

    // Keyword search filter (Name or NIS)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const nisMatch = String(s.nis || '').toLowerCase().includes(q);
        const nisnMatch = String(s.nisn || '').toLowerCase().includes(q);
        const classMatch = (s.class_name || '').toLowerCase().includes(q);
        return nameMatch || nisMatch || nisnMatch || classMatch;
      });
    }

    return list;
  }, [students, statusFilter, searchQuery]);

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
    if (s === 'permit' || s === 'izin' || s === 'leave') {
      return { label: 'Izin', color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' };
    }
    return { label: 'Belum Hadir / Alpha', color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' };
  };

  // Header component for FlatList
  const renderHeader = () => {
    const permitSickTotal = (statistics.sick_count || 0) + (statistics.permit_count || 0);

    return (
      <View style={styles.headerArea}>
        {/* Date Navigator Bar */}
        <View style={styles.dateNavigatorCard}>
          <TouchableOpacity style={styles.navDayBtn} onPress={handlePrevDay}>
            <ChevronLeft size={20} color="#2563EB" />
          </TouchableOpacity>

          <View style={styles.dateCenterCol}>
            <Text style={styles.dateFormattedText}>
              {dateFormatted || selectedDate}
            </Text>
            {isToday ? (
              <View style={styles.todayPill}>
                <Text style={styles.todayPillText}>Hari Ini</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleJumpToday} style={styles.jumpTodayLink}>
                <Text style={styles.jumpTodayText}>Kembali ke Hari Ini</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.navDayBtn} onPress={handleNextDay}>
            <ChevronRight size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama siswa, NIS, atau kelas..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Class Filter Horizontal Pills */}
        <View style={styles.classFilterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classScrollView}>
            <TouchableOpacity
              style={[styles.classPill, selectedClassId === 'all' && styles.classPillActive]}
              onPress={() => setSelectedClassId('all')}
            >
              <GraduationCap size={14} color={selectedClassId === 'all' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 4 }} />
              <Text style={[styles.classPillText, selectedClassId === 'all' && styles.classPillTextActive]}>
                Semua Kelas
              </Text>
            </TouchableOpacity>

            {classesList.map((cls) => {
              const isActive = String(selectedClassId) === String(cls.id);
              return (
                <TouchableOpacity
                  key={cls.id}
                  style={[styles.classPill, isActive && styles.classPillActive]}
                  onPress={() => setSelectedClassId(cls.id)}
                >
                  <Text style={[styles.classPillText, isActive && styles.classPillTextActive]}>
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* KPI Statistics Summary Card */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTopRow}>
            <View>
              <Text style={styles.kpiTitle}>Rekap Presensi Siswa</Text>
              <Text style={styles.kpiSub}>
                {selectedClassId === 'all' ? 'Seluruh Kelas' : `Kelas Terpilih`}
              </Text>
            </View>
            <View style={styles.kpiRateBadge}>
              <TrendingUp size={14} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={styles.kpiRateText}>{statistics.attendance_rate || 0}% Hadir</Text>
            </View>
          </View>

          {/* 4 Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
              <Text style={[styles.statNum, { color: '#0F172A' }]}>{statistics.total_students || 0}</Text>
              <Text style={styles.statLabel}>Total Siswa</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={[styles.statNum, { color: '#065F46' }]}>{statistics.ontime_count || 0}</Text>
              <Text style={[styles.statLabel, { color: '#047857' }]}>Tepat Waktu</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Text style={[styles.statNum, { color: '#92400E' }]}>{statistics.late_count || 0}</Text>
              <Text style={[styles.statLabel, { color: '#B45309' }]}>Terlambat</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={[styles.statNum, { color: '#1E40AF' }]}>{permitSickTotal}</Text>
              <Text style={[styles.statLabel, { color: '#1D4ED8' }]}>Izin/Sakit</Text>
            </View>
          </View>
        </View>

        {/* Status Chips Filter */}
        <View style={styles.statusChipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusScrollView}>
            <TouchableOpacity
              style={[styles.statusChip, statusFilter === 'all' && styles.statusChipActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.statusChipText, statusFilter === 'all' && styles.statusChipTextActive]}>
                Semua ({students.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusChip, statusFilter === 'ontime' && styles.chipActiveGreen]}
              onPress={() => setStatusFilter('ontime')}
            >
              <Text style={[styles.statusChipText, statusFilter === 'ontime' && styles.chipTextActiveGreen]}>
                Tepat ({statistics.ontime_count || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusChip, statusFilter === 'late' && styles.chipActiveOrange]}
              onPress={() => setStatusFilter('late')}
            >
              <Text style={[styles.statusChipText, statusFilter === 'late' && styles.chipTextActiveOrange]}>
                Terlambat ({statistics.late_count || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusChip, statusFilter === 'permit' && styles.chipActiveBlue]}
              onPress={() => setStatusFilter('permit')}
            >
              <Text style={[styles.statusChipText, statusFilter === 'permit' && styles.chipTextActiveBlue]}>
                Izin/Sakit ({permitSickTotal})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusChip, statusFilter === 'alpha' && styles.chipActiveRed]}
              onPress={() => setStatusFilter('alpha')}
            >
              <Text style={[styles.statusChipText, statusFilter === 'alpha' && styles.chipTextActiveRed]}>
                Belum Hadir ({statistics.alpha_count || 0})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Result Counter & Active Filters Indicator */}
        <View style={styles.resultInfoRow}>
          <Text style={styles.resultInfoText}>
            Menampilkan <Text style={{ fontWeight: '700', color: '#0F172A' }}>{filteredStudents.length}</Text> siswa
          </Text>
          {searchQuery.trim() ? (
            <Text style={styles.activeSearchTag} numberOfLines={1}>
              "{searchQuery}"
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle}>Riwayat Presensi Siswa</Text>
          <Text style={styles.topBarSub}>Monitoring Kehadiran Siswa</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Main Student List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat data presensi siswa...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color="#CBD5E1" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Tidak Ditemukan Siswa</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? `Tidak ada siswa yang cocok dengan pencarian "${searchQuery}".`
                  : 'Tidak ada data siswa untuk kelas atau filter status yang dipilih.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = formatStatusBadge(item.status);
            const initials = (item.name || 'S')
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase();

            return (
              <View style={styles.studentCard}>
                {/* Card Top: Avatar, Name, NIS, Class & Status */}
                <View style={styles.cardTopRow}>
                  {/* Avatar Initials */}
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>

                  <View style={styles.studentMainInfo}>
                    <View style={styles.nameClassRow}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.subMetaRow}>
                      <Text style={styles.nisText}>NIS: {item.nis || '-'}</Text>
                      <View style={styles.classBadge}>
                        <Text style={styles.classBadgeText}>{item.class_name}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Card Bottom: Times & Photo */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.timeInfoCol}>
                    <Clock size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.timeLabelText}>
                      Masuk: <Text style={styles.timeValText}>{item.check_in || '--:--'}</Text>
                      {'   •   '}
                      Pulang: <Text style={styles.timeValText}>{item.check_out || '--:--'}</Text>
                    </Text>
                  </View>

                  {item.photo_url && (
                    <TouchableOpacity
                      style={styles.photoLinkBtn}
                      onPress={() => setPreviewPhotoUrl(item.photo_url)}
                      activeOpacity={0.8}
                    >
                      <Camera size={12} color="#2563EB" style={{ marginRight: 4 }} />
                      <Text style={styles.photoLinkText}>Foto</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Notes if any */}
                {item.notes ? (
                  <View style={styles.notesRow}>
                    <FileText size={12} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}

      {/* Photo Preview Modal */}
      <Modal visible={!!previewPhotoUrl} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewPhotoUrl(null)}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {previewPhotoUrl && (
            <View style={styles.modalImageWrapper}>
              <Image source={{ uri: previewPhotoUrl }} style={styles.modalFullImage} resizeMode="contain" />
              <Text style={styles.modalImageCaption}>Foto Presensi Siswa</Text>
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
  },
  headerArea: {
    marginBottom: 8,
  },
  dateNavigatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  navDayBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenterCol: {
    alignItems: 'center',
  },
  dateFormattedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  jumpTodayLink: {
    marginTop: 2,
  },
  jumpTodayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  classFilterWrapper: {
    marginBottom: 10,
  },
  classScrollView: {
    paddingHorizontal: 16,
    gap: 8,
  },
  classPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  classPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  classPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  classPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  kpiRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  kpiRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  statusChipsContainer: {
    marginBottom: 8,
  },
  statusScrollView: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipActiveGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  chipTextActiveGreen: {
    color: '#065F46',
    fontWeight: '700',
  },
  chipActiveOrange: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  chipTextActiveOrange: {
    color: '#92400E',
    fontWeight: '700',
  },
  chipActiveBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  chipTextActiveBlue: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  chipActiveRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  chipTextActiveRed: {
    color: '#991B1B',
    fontWeight: '700',
  },
  resultInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  resultInfoText: {
    fontSize: 11,
    color: '#64748B',
  },
  activeSearchTag: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#2563EB',
    maxWidth: 160,
  },
  listContent: {
    paddingBottom: 40,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  studentMainInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  nisText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  classBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  timeInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabelText: {
    fontSize: 11,
    color: '#64748B',
  },
  timeValText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  photoLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  photoLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  notesText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCloseBtn: {
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
  modalImageWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  modalFullImage: {
    width: '100%',
    height: 420,
    borderRadius: 16,
  },
  modalImageCaption: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
  },
});

export default StudentHistoryScreen;
