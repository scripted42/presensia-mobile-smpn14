import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
} from 'lucide-react-native';
import SkeletonLoader from './SkeletonLoader';

const StatCardsSection = ({ stats, loading = false, monthName = 'Bulan Ini' }) => {
  const totalMasuk = stats?.total_masuk ?? stats?.present_days ?? 0;
  const ontimeCount = stats?.ontime_days ?? 0;
  const lateCount = stats?.late_days ?? 0;
  const otherCount = (stats?.sick_days || 0) + (stats?.permit_days || 0) + (stats?.leave_days || 0);
  const percentage = stats?.attendance_percentage ?? 0;

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Ringkasan {monthName}</Text>
          <Text style={styles.sectionSub}>Statistik kehadiran Anda pada periode ini</Text>
        </View>
        <View style={styles.percentageBadge}>
          <TrendingUp size={13} color="#2563EB" style={{ marginRight: 4 }} />
          <Text style={styles.percentageText}>{percentage}% Hadir</Text>
        </View>
      </View>

      {/* Grid of 4 Stat Cards */}
      {loading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.card, styles.skeletonCard]}>
              <SkeletonLoader width={28} height={28} borderRadius={8} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={40} height={18} borderRadius={6} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={60} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {/* Card 1: Total Hadir */}
          <View style={[styles.card, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <CheckCircle2 size={16} color="#0284C7" />
            </View>
            <Text style={[styles.statNumber, { color: '#0369A1' }]}>{totalMasuk}</Text>
            <Text style={styles.statLabel}>Total Hadir</Text>
          </View>

          {/* Card 2: Tepat Waktu */}
          <View style={[styles.card, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle2 size={16} color="#059669" />
            </View>
            <Text style={[styles.statNumber, { color: '#065F46' }]}>{ontimeCount}</Text>
            <Text style={styles.statLabel}>Tepat Waktu</Text>
          </View>

          {/* Card 3: Terlambat */}
          <View style={[styles.card, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#FDE68A' }]}>
              <Clock size={16} color="#D97706" />
            </View>
            <Text style={[styles.statNumber, { color: '#92400E' }]}>{lateCount}</Text>
            <Text style={styles.statLabel}>Terlambat</Text>
          </View>

          {/* Card 4: Izin / Sakit */}
          <View style={[styles.card, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Calendar size={16} color="#2563EB" />
            </View>
            <Text style={[styles.statNumber, { color: '#1E40AF' }]}>{otherCount}</Text>
            <Text style={styles.statLabel}>Izin / Sakit</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  percentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  skeletonCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});

export default StatCardsSection;
