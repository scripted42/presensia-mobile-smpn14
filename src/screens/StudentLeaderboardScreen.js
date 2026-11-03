import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '../api/client';
import {
  ArrowLeft,
  Info,
  Bell,
  Trophy,
  Flame,
  Award,
  ChevronRight,
  ShieldCheck,
  Star,
  Users,
  CheckCircle2,
  Sparkles,
  Calendar,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Data Peringkat Kelas (Sesuai Desain Stitch)
const CLASS_LEADERBOARD = [
  {
    rank: 1,
    name: 'Kelas 8-B',
    initial: '8B',
    grade: '8',
    studentsCount: 32,
    rate: '99.4%',
    streak: 22,
    points: '2.980 XP',
    badge: '☆ 99.4% Juara 1',
    isMyClass: true,
    avatarBg: '#FEF3C7',
    avatarText: '#B45309',
    representative: 'Ahmad Rayhan',
  },
  {
    rank: 2,
    name: 'Kelas 7-A',
    initial: '7A',
    grade: '7',
    studentsCount: 32,
    rate: '98.7%',
    streak: 18,
    points: '2.840 XP',
    badge: '98.7% Tepat',
    isMyClass: false,
    avatarBg: '#EFF6FF',
    avatarText: '#1D4ED8',
    representative: 'Nabila Putri',
  },
  {
    rank: 3,
    name: 'Kelas 9-C',
    initial: '9C',
    grade: '9',
    studentsCount: 30,
    rate: '97.9%',
    streak: 15,
    points: '2.710 XP',
    badge: '97.9% Tepat',
    isMyClass: false,
    avatarBg: '#FFF7ED',
    avatarText: '#C2410C',
    representative: 'Dimas Setiawan',
  },
  {
    rank: 4,
    name: 'Kelas VII-B',
    initial: '7B',
    grade: '7',
    studentsCount: 31,
    rate: '96.8%',
    streak: 16,
    bonusXP: '+120 XP',
    isMyClass: false,
    badgeColor: '#EFF6FF',
    textColor: '#2563EB',
  },
  {
    rank: 5,
    name: 'Kelas VIII-A',
    initial: '8A',
    grade: '8',
    studentsCount: 32,
    rate: '95.4%',
    streak: 12,
    bonusXP: '+95 XP',
    isMyClass: false,
    badgeColor: '#F0FDF4',
    textColor: '#16A34A',
  },
  {
    rank: 6,
    name: 'Kelas IX-A',
    initial: '9A',
    grade: '9',
    studentsCount: 30,
    rate: '94.1%',
    streak: 8,
    bonusXP: '+80 XP',
    isMyClass: false,
    badgeColor: '#FAF5FF',
    textColor: '#9333EA',
  },
  {
    rank: 7,
    name: 'Kelas VII-C',
    initial: '7C',
    grade: '7',
    studentsCount: 32,
    rate: '93.6%',
    streak: 5,
    bonusXP: '+60 XP',
    isMyClass: false,
    badgeColor: '#ECFEFF',
    textColor: '#0891B2',
  },
];

// Data Top Siswa Individu
const TOP_STUDENTS = [
  {
    rank: 1,
    name: 'Ahmad Rayhan',
    class: '8-B',
    nis: '14082',
    points: '1.450 XP',
    streak: 22,
    badgeTitle: 'Streak Master',
    isMe: true,
  },
  {
    rank: 2,
    name: 'Nabila Putri Azzahra',
    class: '7-A',
    nis: '14210',
    points: '1.420 XP',
    streak: 20,
    badgeTitle: 'Early Bird',
    isMe: false,
  },
  {
    rank: 3,
    name: 'Dimas Bagus Setiawan',
    class: '9-C',
    nis: '13994',
    points: '1.390 XP',
    streak: 19,
    badgeTitle: 'Hadir 100%',
    isMe: false,
  },
  {
    rank: 4,
    name: 'Siti Nurhaliza',
    class: '8-B',
    nis: '14095',
    points: '1.340 XP',
    streak: 18,
    badgeTitle: 'Disiplin Emas',
    isMe: false,
  },
  {
    rank: 5,
    name: 'Farhan Maulana',
    class: '9-A',
    nis: '13950',
    points: '1.290 XP',
    streak: 16,
    badgeTitle: 'Pejuang Pagi',
    isMe: false,
  },
];

export default function StudentLeaderboardScreen({ onBack, onNavigate, user, isStudent = true }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('class'); // 'class' | 'student'
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | '7' | '8' | '9'
  const [classes, setClasses] = useState(CLASS_LEADERBOARD);
  const [students, setStudents] = useState(TOP_STUDENTS);
  const [periodLabel, setPeriodLabel] = useState('PERIODE BULAN INI');
  const [updatedAt, setUpdatedAt] = useState('Pembaruan: Hari ini');
  const [myClassSummary, setMyClassSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isFetchingRef.current && !isRefresh) return;
    isFetchingRef.current = true;
    try {
      const res = await client.get('/attendance/leaderboard');
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (Array.isArray(d.classes) && d.classes.length > 0) {
          setClasses(d.classes);
        }
        if (Array.isArray(d.students) && d.students.length > 0) {
          setStudents(d.students);
        }
        if (d.period_label) {
          setPeriodLabel(d.period_label.toUpperCase());
        }
        if (d.updated_at) {
          setUpdatedAt(`Pembaruan: ${d.updated_at}`);
        }
        if (d.my_class) {
          setMyClassSummary(d.my_class);
        }
      }
    } catch (e) {
      console.log('Leaderboard API fetch notice:', e?.message);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Filter ranking kelas sesuai jenjang
  const filteredClasses = classes.filter((c) => {
    if (selectedFilter === 'all') return true;
    return String(c.grade) === String(selectedFilter);
  });

  const rank1 = filteredClasses.find((c) => c.rank === 1 && (c.total_attendance > 0 || c.rate_num > 0)) || null;
  const rank2 = filteredClasses.find((c) => c.rank === 2 && (c.total_attendance > 0 || c.rate_num > 0)) || null;
  const rank3 = filteredClasses.find((c) => c.rank === 3 && (c.total_attendance > 0 || c.rate_num > 0)) || null;

  // Cek apakah sudah ada kelas yang memiliki data absensi aktif
  const hasActiveClasses = filteredClasses.some((c) => (c.total_attendance > 0 || c.rate_num > 0));

  // Filter top siswa sesuai jenjang
  const filteredStudents = students.filter((s) => {
    if (selectedFilter === 'all') return true;
    return String(s.grade) === String(selectedFilter);
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP APP BAR (Identical to Riwayat & Profil) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.topBarTitleContainer}>
          <Text style={styles.topBarTitle}>Peringkat Disiplin</Text>
          <Text style={styles.topBarSub}>Klasemen Kehadiran Siswa</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLeaderboard();
            }}
            colors={['#023C69']}
          />
        }
      >
        {/* BANNER PERIODE (Google Stitch Header Card) */}
        <View style={styles.periodBanner}>
          <View style={styles.periodHeaderRow}>
            <View style={styles.periodStarIcon}>
              <Star size={14} color="#FDE047" fill="#FDE047" />
            </View>
            <Text style={styles.periodTag}>{periodLabel}</Text>
          </View>
          <View style={styles.periodContentRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.periodMainTitle}>Klasemen Kehadiran & Tata Tertib</Text>
              <Text style={styles.periodUpdate}>{updatedAt}</Text>
            </View>
            <View style={styles.periodTrophyBadge}>
              <Trophy size={26} color="#FACC15" />
            </View>
          </View>
        </View>

        {/* SEGMENTED PILL SWITCHER */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'class' && styles.tabButtonActive]}
            onPress={() => setActiveTab('class')}
            activeOpacity={0.8}
          >
            <Trophy size={16} color={activeTab === 'class' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'class' && styles.tabTextActive]}>
              Peringkat Kelas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'student' && styles.tabButtonActive]}
            onPress={() => setActiveTab('student')}
            activeOpacity={0.8}
          >
            <Award size={16} color={activeTab === 'student' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'student' && styles.tabTextActive]}>
              Top Siswa
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: PERINGKAT KELAS */}
        {activeTab === 'class' ? (
          <>
            {/* Filter Jenjang Kelas */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <Text style={styles.filterLabel}>Tingkat:</Text>
              {[
                { id: 'all', label: 'Semua Kelas' },
                { id: '7', label: 'Kelas 7' },
                { id: '8', label: 'Kelas 8' },
                { id: '9', label: 'Kelas 9' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterChip, selectedFilter === f.id && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(f.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === f.id && styles.filterChipTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 3D PODIUM SECTION */}
            <View style={styles.podiumSection}>
              {/* PODIUM 2 (SILVER) */}
              <View style={styles.podiumCol}>
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatarCircle, { borderColor: '#93C5FD' }]}>
                    <Text style={[styles.avatarInitials, { color: '#1D4ED8' }]}>{rank2?.initial || '2'}</Text>
                  </View>
                  <View style={[styles.medalBadge, { backgroundColor: '#CBD5E1' }]}>
                    <Text style={styles.medalNumber}>2</Text>
                  </View>
                </View>
                <Text style={styles.podiumClassName}>{rank2?.name || '-'}</Text>
                <View style={[styles.percentBadge, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                  <Text style={[styles.percentText, { color: '#1D4ED8' }]}>{rank2?.rate ? `${rank2.rate} Tepat` : '-'}</Text>
                </View>

                {/* Silver Block */}
                <View style={[styles.podiumBlock, styles.podiumSilver]}>
                  <Text style={styles.podiumBigNum}>2</Text>
                  <Text style={styles.podiumMetalName}>PERAK</Text>
                  <Text style={styles.podiumStudentCount}>{rank2?.studentsCount ? `${rank2.studentsCount} Siswa` : '-'}</Text>
                </View>
              </View>

              {/* PODIUM 1 (GOLD) */}
              <View style={[styles.podiumCol, { marginTop: -20 }]}>
                {/* Crown Icon */}
                <View style={styles.crownBox}>
                  <Text style={{ fontSize: 20 }}>👑</Text>
                </View>

                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatarCircle, { borderColor: '#F59E0B', width: 66, height: 66, borderRadius: 33 }]}>
                    <Text style={[styles.avatarInitials, { color: '#B45309', fontSize: 18 }]}>{rank1?.initial || '1'}</Text>
                  </View>
                  <View style={[styles.medalBadge, { backgroundColor: '#FACC15', width: 22, height: 22, borderRadius: 11 }]}>
                    <Star size={12} color="#78350F" fill="#78350F" />
                  </View>
                </View>
                <Text style={[styles.podiumClassName, { fontSize: 14, color: '#023C69' }]}>
                  {rank1?.name || '-'}
                </Text>
                <View style={[styles.percentBadge, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                  <Text style={[styles.percentText, { color: '#15803D' }]}>{rank1?.badge || '-'}</Text>
                </View>

                {/* Gold Block (Highest) */}
                <View style={[styles.podiumBlock, styles.podiumGold]}>
                  <View style={styles.goldTitleTag}>
                    <Trophy size={11} color="#78350F" />
                    <Text style={styles.goldTitleText}>Piala Bergilir</Text>
                  </View>
                  <Text style={[styles.podiumBigNum, { fontSize: 38 }]}>1</Text>
                  <Text style={[styles.podiumMetalName, { color: '#78350F' }]}>EMAS UTAMA</Text>
                  <Text style={[styles.podiumStudentCount, { color: '#92400E' }]}>
                    {rank1?.points || '-'}
                  </Text>
                </View>
              </View>

              {/* PODIUM 3 (BRONZE) */}
              <View style={[styles.podiumCol, { marginTop: 15 }]}>
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatarCircle, { borderColor: '#FDBA74' }]}>
                    <Text style={[styles.avatarInitials, { color: '#C2410C' }]}>{rank3?.initial || '3'}</Text>
                  </View>
                  <View style={[styles.medalBadge, { backgroundColor: '#F97316' }]}>
                    <Text style={styles.medalNumber}>3</Text>
                  </View>
                </View>
                <Text style={styles.podiumClassName}>{rank3?.name || '-'}</Text>
                <View style={[styles.percentBadge, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                  <Text style={[styles.percentText, { color: '#C2410C' }]}>{rank3?.rate ? `${rank3.rate} Tepat` : '-'}</Text>
                </View>

                {/* Bronze Block */}
                <View style={[styles.podiumBlock, styles.podiumBronze]}>
                  <Text style={styles.podiumBigNum}>3</Text>
                  <Text style={styles.podiumMetalName}>PERUNGGU</Text>
                  <Text style={styles.podiumStudentCount}>{rank3?.studentsCount} Siswa</Text>
                </View>
              </View>
            </View>

            {/* SECTION LIST RANKING 4 KE BAWAH */}
            <View style={styles.listSectionHeader}>
              <View>
                <Text style={styles.listSectionTitle}>Peringkat Kelas Lainnya</Text>
                <Text style={styles.listSectionSub}>Rekapitulasi Kehadiran Kelas</Text>
              </View>
              <View style={styles.badgeDate}>
                <Calendar size={12} color="#023C69" />
                <Text style={styles.badgeDateText}>Bulan Ini</Text>
              </View>
            </View>

            {/* DAFTAR CARD KELAS LAINNYA */}
            {filteredClasses
              .filter((c) => !c.rank || c.rank > 3)
              .map((item) => (
                <View key={item.class_id || item.name} style={styles.rankCard}>
                  <Text style={styles.rankNumber}>{item.rank ? `#${item.rank}` : '-'}</Text>

                  <View style={[styles.rankAvatarCircle, { backgroundColor: item.badgeColor || '#F1F5F9' }]}>
                    <Text style={[styles.rankAvatarText, { color: item.textColor || '#023C69' }]}>
                      {item.initial}
                    </Text>
                  </View>

                  <View style={styles.rankInfoBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.rankClassName}>{item.name}</Text>
                      {item.total_attendance > 0 && <View style={styles.greenDot} />}
                    </View>
                    <Text style={styles.rankClassMeta}>
                      {item.studentsCount} Siswa • {item.total_attendance > 0 ? `${item.rate} Kehadiran` : 'Belum Ada Presensi'}
                    </Text>
                    {/* Mini Progress Bar */}
                    <View style={styles.rankProgressBar}>
                      <View
                        style={[
                          styles.rankProgressFill,
                          {
                            width: `${parseFloat(item.rate) || 0}%`,
                            backgroundColor: item.textColor || '#2563EB',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Flame Streak Pill */}
                  {item.total_attendance > 0 ? (
                    <View style={styles.streakPill}>
                      <Flame size={13} color="#EA580C" fill="#EA580C" />
                      <Text style={styles.streakText}>{item.streak} Hari</Text>
                      <Text style={styles.streakXP}>{item.bonusXP}</Text>
                    </View>
                  ) : (
                    <View style={[styles.streakPill, { backgroundColor: '#F1F5F9', minWidth: 80, alignItems: 'center' }]}>
                      <Text style={[styles.streakText, { color: '#94A3B8' }]}>0 Presensi</Text>
                    </View>
                  )}
                </View>
              ))}

            {/* INFO CARD TRANSPARANSI POIN */}
            <View style={styles.infoBox}>
              <CheckCircle2 size={18} color="#2563EB" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoBoxText}>
                  Poin dan persentase kehadiran dihitung otomatis setiap hari kerja murni dari catatan jam absensi siswa:
                </Text>
                <Text style={[styles.infoBoxText, { marginTop: 4, fontWeight: '600', color: '#1E40AF' }]}>
                  • Sebelum 06.30: +100 XP (Early Bird)
                  {'\n'}• 06.30 - 06.45: +70 XP (Tepat Waktu)
                  {'\n'}• Terlambat: -20 XP (Penalti)
                  {'\n'}• Alpha: -50 XP (Penalti)
                  {'\n'}• Izin / Sakit: 0 XP (Netral)
                </Text>
              </View>
            </View>
          </>
        ) : (
          /* TAB 2: TOP SISWA INDIVIDU */
          <View style={styles.studentTabContent}>
            <View style={styles.topStudentBanner}>
              <View style={styles.studentBannerLeft}>
                <Text style={styles.topStudentBannerTitle}>🏅 Ksatria Disiplin SMPN 14</Text>
                <Text style={styles.topStudentBannerSub}>
                  Siswa paling rajin dan konsisten hadir tepat waktu bulan ini.
                </Text>
              </View>
            </View>

            {filteredStudents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Award size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Belum Ada Siswa yang Absen</Text>
                <Text style={styles.emptySub}>
                  Siswa yang hadir dan tercatat tepat waktu akan otomatis muncul di klasemen ksatria disiplin ini.
                </Text>
              </View>
            ) : (
              filteredStudents.map((s, idx) => (
                <View
                  key={s.user_id || s.rank || idx}
                  style={[styles.studentCard, s.isMe && styles.studentCardMe]}
                >
                <View style={styles.studentRankBadge}>
                  <Text
                    style={[
                      styles.studentRankNum,
                      s.rank === 1 && { color: '#B45309', fontWeight: '900' },
                      s.rank === 2 && { color: '#475569' },
                      s.rank === 3 && { color: '#9A3412' },
                    ]}
                  >
                    #{s.rank}
                  </Text>
                </View>

                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarInitials}>
                    {s.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </Text>
                </View>

                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {s.isMe && (
                      <View style={styles.mePill}>
                        <Text style={styles.mePillText}>Kamu</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.studentMeta}>
                    NIS: {s.nis} • Kelas {s.class}
                  </Text>
                  <View style={styles.badgeTitlePill}>
                    <Award size={10} color="#023C69" />
                    <Text style={styles.badgeTitleText}>{s.badgeTitle}</Text>
                  </View>
                </View>

                <View style={styles.studentPointsBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Flame size={12} color="#EA580C" fill="#EA580C" />
                    <Text style={styles.studentStreakText}>{s.streak} Hari</Text>
                  </View>
                  <Text style={styles.studentXPText}>{s.points}</Text>
                </View>
              </View>
            )))}

            {/* INFO CARD TRANSPARANSI POIN DI TAB SISWA */}
            <View style={styles.infoBox}>
              <CheckCircle2 size={18} color="#2563EB" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoBoxText}>
                  Perolehan XP dihitung otomatis dari jam scan absensi gerbang SMPN 14:
                </Text>
                <Text style={[styles.infoBoxText, { marginTop: 4, fontWeight: '600', color: '#1E40AF' }]}>
                  • Sebelum 06.30: +100 XP (Disiplin Emas / Early Bird)
                  {'\n'}• 06.30 - 06.45: +70 XP (Tepat Waktu Standar)
                  {'\n'}• Terlambat: -20 XP (Penalti Keterlambatan)
                  {'\n'}• Alpha: -50 XP (Penalti Tanpa Keterangan)
                  {'\n'}• Izin / Sakit: 0 XP (Netral)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* BOTTOM SPACING FOR FLOATING BAR */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* STICKY FLOATING BANNER SISWA (Google Stitch Golden Ribbon) */}
      <View style={styles.floatingBarWrapper}>
        <View style={styles.floatingBar}>
          <View style={styles.floatingTrophyIcon}>
            <Trophy size={18} color="#78350F" fill="#FACC15" />
          </View>

          <View style={{ flex: 1, paddingHorizontal: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.floatingTitle}>
                {isStudent
                  ? (myClassSummary ? `${myClassSummary.name} Peringkat #${myClassSummary.rank}!` : 'Kelas Kamu Memimpin!')
                  : 'Monitoring Presensi Siswa'}
              </Text>
              <View style={styles.floatingRankPill}>
                <Text style={styles.floatingRankText}>
                  {isStudent ? (myClassSummary ? `#${myClassSummary.rank}` : '#1') : 'Live'}
                </Text>
              </View>
            </View>
            <Text style={styles.floatingSub}>
              {isStudent
                ? (myClassSummary?.rank === 1
                    ? 'Pertahankan untuk juara piala bergilir 🏆'
                    : `Kehadiran kelas ${myClassSummary?.rate || '98%'}. Tingkatkan kedisiplinan!`)
                : `${rank1?.name || 'Kelas Teratas'} memimpin rekap presensi (${rank1?.rate || '99%'})`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.floatingDetailBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (onNavigate) {
                if (isStudent) {
                  onNavigate('history-tab');
                } else {
                  onNavigate('student-history');
                }
              }
            }}
          >
            <Text style={styles.floatingDetailBtnText}>Detail</Text>
            <ChevronRight size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  topBarSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // PERIOD BANNER
  periodBanner: {
    backgroundColor: '#023C69',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#023C69',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  periodHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodStarIcon: {
    marginRight: 6,
  },
  periodTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.6,
  },
  periodContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  periodUpdate: {
    fontSize: 11,
    color: '#BFDBFE',
    marginTop: 4,
  },
  periodTrophyBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  // TAB SWITCHER
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#023C69',
    shadowColor: '#023C69',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // FILTER CHIPS
  filterScroll: {
    alignItems: 'center',
    paddingBottom: 16,
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#023C69',
    borderColor: '#023C69',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // PODIUM SECTION
  podiumSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  podiumCol: {
    alignItems: 'center',
    width: (width - 48) / 3,
  },
  crownBox: {
    marginBottom: -4,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
  },
  medalBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  medalNumber: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  podiumClassName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  percentText: {
    fontSize: 10,
    fontWeight: '800',
  },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  podiumSilver: {
    height: 110,
    backgroundColor: '#BFDBFE',
    borderTopWidth: 4,
    borderTopColor: '#93C5FD',
  },
  podiumGold: {
    height: 140,
    backgroundColor: '#FDE047',
    borderTopWidth: 4,
    borderTopColor: '#FACC15',
  },
  podiumBronze: {
    height: 95,
    backgroundColor: '#FED7AA',
    borderTopWidth: 4,
    borderTopColor: '#FDBA74',
  },
  goldTitleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  goldTitleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#78350F',
  },
  podiumBigNum: {
    fontSize: 30,
    fontWeight: '900',
    color: '#023C69',
  },
  podiumMetalName: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#1E3A8A',
    marginTop: 1,
  },
  podiumStudentCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 2,
  },

  // LIST HEADER
  listSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  listSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  badgeDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#023C69',
  },

  // RANK CARDS
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  rankNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#94A3B8',
    width: 28,
    textAlign: 'center',
  },
  rankAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankAvatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  rankInfoBox: {
    flex: 1,
  },
  rankClassName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 6,
  },
  rankClassMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rankProgressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  rankProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  streakPill: {
    alignItems: 'flex-end',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    marginTop: 1,
  },
  streakXP: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 1,
  },

  // INFO BOX
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },

  // TAB 2: TOP SISWA
  studentTabContent: {
    paddingTop: 4,
  },
  topStudentBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  topStudentBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FACC15',
  },
  topStudentBannerSub: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  studentCardMe: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
  },
  studentRankBadge: {
    width: 28,
    alignItems: 'center',
  },
  studentRankNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  studentAvatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  mePill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  mePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  studentMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  badgeTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeTitleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
  },
  studentPointsBox: {
    alignItems: 'flex-end',
  },
  studentStreakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    marginLeft: 2,
  },
  studentXPText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#023C69',
    marginTop: 2,
  },

  // FLOATING BOTTOM BANNER
  floatingBarWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#023C69',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#023C69',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingTrophyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingRankPill: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    marginLeft: 6,
  },
  floatingRankText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#78350F',
  },
  floatingSub: {
    fontSize: 10,
    color: '#93C5FD',
    marginTop: 2,
  },
  floatingDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  floatingDetailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
