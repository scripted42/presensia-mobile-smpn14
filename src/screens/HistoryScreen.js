import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import client from '../api/client';
import { Calendar, Clock, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react-native';

const HistoryScreen = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await client.get('/attendance/history');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setHistory(res.data.data);
      }
    } catch (e) {
      console.warn('Gagal membaca riwayat:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatStatus = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'ontime' || s === 'present' || s === 'tepat_waktu') {
      return { label: 'Tepat Waktu', color: '#059669', bg: '#ECFDF5' };
    }
    if (s === 'late' || s === 'terlambat') {
      return { label: 'Terlambat', color: '#D97706', bg: '#FEF3C7' };
    }
    if (s === 'permission' || s === 'leave' || s === 'izin') {
      return { label: 'Izin / Sakit', color: '#2563EB', bg: '#EFF6FF' };
    }
    return { label: status || 'Alpha', color: '#DC2626', bg: '#FEF2F2' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Absensi</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color="#CBD5E1" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>Belum Ada Catatan</Text>
          <Text style={styles.emptySub}>Catatan kehadiran Anda pada bulan ini akan ditampilkan di sini.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
          renderItem={({ item }) => {
            const badge = formatStatus(item.status);
            const dateObj = item.date ? new Date(item.date) : new Date();
            const dateStr = dateObj.toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.dateBox}>
                    <Calendar size={14} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.dateText}>{dateStr}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeCol}>
                    <Text style={styles.timeLabel}>Masuk</Text>
                    <Text style={styles.timeValue}>
                      {item.check_in
                        ? new Date(item.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.timeCol}>
                    <Text style={styles.timeLabel}>Pulang</Text>
                    <Text style={styles.timeValue}>
                      {item.check_out
                        ? new Date(item.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </Text>
                  </View>
                </View>

                {item.location_name ? (
                  <Text style={styles.locationText} numberOfLines={1}>
                    📍 {item.location_name}
                  </Text>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  timeCol: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default HistoryScreen;
