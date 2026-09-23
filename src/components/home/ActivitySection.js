import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  Inbox,
} from 'lucide-react-native';
import SkeletonLoader from './SkeletonLoader';

const ActivitySection = ({ activities = [], loading = false, onViewAllPress }) => {
  const getStatusBadge = (status) => {
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
    return { label: 'Alpha', color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' };
  };

  const formatTimeStr = (val) => {
    if (!val) return '--:--';
    const str = String(val).trim();
    if (/^\d{2}:\d{2}/.test(str)) {
      return str.substring(0, 5);
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

  const formatDateStr = (dateVal, formattedVal) => {
    if (formattedVal && typeof formattedVal === 'string' && !formattedVal.includes('T')) {
      return formattedVal;
    }
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        });
      }
    } catch (_) {}
    return String(dateVal).substring(0, 10);
  };

  const recentItems = activities.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Aktivitas Presensi Terakhir</Text>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={onViewAllPress}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>Lihat Semua</Text>
          <ChevronRight size={14} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* List Container */}
      <View style={styles.card}>
        {loading ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonRow}>
                <SkeletonLoader width={36} height={36} borderRadius={10} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="40%" height={10} borderRadius={4} />
                </View>
                <SkeletonLoader width={70} height={20} borderRadius={6} />
              </View>
            ))}
          </View>
        ) : recentItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Inbox size={32} color="#CBD5E1" style={{ marginBottom: 6 }} />
            <Text style={styles.emptyText}>Belum ada riwayat aktivitas presensi.</Text>
          </View>
        ) : (
          recentItems.map((item, idx) => {
            const badge = getStatusBadge(item.status);
            const isLast = idx === recentItems.length - 1;

            return (
              <View key={item.id || idx}>
                <View style={styles.itemRow}>
                  {/* Left Icon */}
                  <View style={[styles.statusIconBox, { backgroundColor: badge.bg }]}>
                    <CheckCircle2 size={16} color={badge.dot} />
                  </View>

                  {/* Middle: Date & Time */}
                  <View style={styles.itemMiddleCol}>
                    <Text style={styles.itemDateText}>
                      {formatDateStr(item.date, item.date_formatted)}
                    </Text>
                    <View style={styles.timeRow}>
                      <Clock size={11} color="#64748B" style={{ marginRight: 3 }} />
                      <Text style={styles.timeText}>
                        {formatTimeStr(item.check_in)} - {formatTimeStr(item.check_out)}
                      </Text>
                    </View>
                  </View>

                  {/* Right Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Divider between items */}
                {!isLast && <View style={styles.divider} />}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginRight: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemMiddleCol: {
    flex: 1,
  },
  itemDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  skeletonContainer: {
    paddingVertical: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default ActivitySection;
