import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  LogOut,
  QrCode,
  Sparkles,
} from 'lucide-react-native';

const HighlightCard = ({
  todayAttendance,
  isStudent,
  onCheckInPress,
  onCheckOutPress,
  onStudentQrPress,
  loading = false,
}) => {
  // Jam digital real-time berdetik tiap 1 detik
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format jam bantuan dengan konversi zona waktu lokal otomatis
  const formatTimeStr = (val) => {
    if (!val) return '--:--';
    const str = String(val).trim();
    // Jika format sudah langsung "HH:mm" atau "HH:mm:ss" tanpa T
    if (/^\d{2}:\d{2}/.test(str)) {
      return str.substring(0, 5);
    }
    // Jika format ISO datetime (misal UTC: 2026-09-23T01:19:xxZ), parse Date agar otomatis terkonversi ke WIB (UTC+7)
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

  const checkInVal = todayAttendance?.check_in || todayAttendance?.check_in_time;
  const checkOutVal = todayAttendance?.check_out || todayAttendance?.check_out_time;
  const hasCheckIn = Boolean(checkInVal || todayAttendance?.has_checked_in);
  const hasCheckOut = Boolean(checkOutVal || todayAttendance?.has_checked_out);

  // Status Badge Logic
  const getStatusInfo = () => {
    if (!todayAttendance) {
      return {
        label: 'Belum Absen Hari Ini',
        bg: 'rgba(239, 68, 68, 0.18)',
        textColor: '#FCA5A5',
        dotColor: '#EF4444',
        icon: AlertTriangle,
      };
    }

    if (hasCheckIn && hasCheckOut) {
      return {
        label: 'Presensi Selesai (Masuk & Pulang)',
        bg: 'rgba(16, 185, 129, 0.18)',
        textColor: '#6EE7B7',
        dotColor: '#10B981',
        icon: CheckCircle2,
      };
    }

    if (hasCheckIn) {
      const isLate = todayAttendance?.status?.toLowerCase() === 'late' || todayAttendance?.status?.toLowerCase() === 'terlambat';
      return {
        label: isLate ? 'Sudah Masuk (Terlambat)' : 'Sudah Masuk (Tepat Waktu)',
        bg: isLate ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)',
        textColor: isLate ? '#FDE68A' : '#6EE7B7',
        dotColor: isLate ? '#F59E0B' : '#10B981',
        icon: isLate ? Clock : CheckCircle2,
      };
    }

    return {
      label: todayAttendance.status || 'Belum Absen',
      bg: 'rgba(255, 255, 255, 0.15)',
      textColor: '#E2E8F0',
      dotColor: '#94A3B8',
      icon: Clock,
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <View style={styles.cardContainer}>
      {/* Background Accent Pill */}
      <View style={styles.topRow}>
        <View style={styles.clockContainer}>
          <Clock size={16} color="#93C5FD" style={{ marginRight: 6 }} />
          <Text style={styles.digitalClockText}>{currentTime || '00:00:00'}</Text>
          <Text style={styles.clockWibText}>WIB</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.dotColor }]} />
          <Text style={[styles.statusBadgeText, { color: statusInfo.textColor }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Row Jam Masuk & Jam Pulang */}
      <View style={styles.timesContainer}>
        <View style={styles.timeBox}>
          <Text style={styles.timeBoxLabel}>Jam Masuk</Text>
          <Text style={styles.timeBoxValue}>{formatTimeStr(checkInVal)}</Text>
        </View>

        <View style={styles.timeDivider} />

        <View style={styles.timeBox}>
          <Text style={styles.timeBoxLabel}>Jam Pulang</Text>
          <Text style={styles.timeBoxValue}>{formatTimeStr(checkOutVal)}</Text>
        </View>
      </View>

      {/* Lokasi Presensi jika ada */}
      {todayAttendance?.location_name ? (
        <View style={styles.locationRow}>
          <MapPin size={12} color="#93C5FD" style={{ marginRight: 4 }} />
          <Text style={styles.locationText} numberOfLines={1}>
            {todayAttendance.location_name}
          </Text>
        </View>
      ) : null}

      {/* Tombol Besar Utama (Primary Action) */}
      <View style={styles.actionContainer}>
        {isStudent ? (
          <TouchableOpacity
            style={styles.studentActionBtn}
            onPress={onStudentQrPress}
            activeOpacity={0.85}
          >
            <QrCode size={20} color="#1E3A8A" style={{ marginRight: 8 }} />
            <Text style={styles.studentActionBtnText}>Tampilkan QR Code Absensi</Text>
          </TouchableOpacity>
        ) : !hasCheckIn ? (
          <TouchableOpacity
            style={styles.checkInBtn}
            onPress={onCheckInPress}
            activeOpacity={0.85}
          >
            <Camera size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.checkInBtnText}>Absen Masuk Sekarang</Text>
          </TouchableOpacity>
        ) : !hasCheckOut ? (
          <TouchableOpacity
            style={styles.checkOutBtn}
            onPress={onCheckOutPress}
            activeOpacity={0.85}
          >
            <LogOut size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.checkOutBtnText}>Absen Pulang Sekarang</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBox}>
            <CheckCircle2 size={18} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.completedText}>Presensi Hari Ini Lengkap</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E3A8A', // Deep modern navy
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  digitalClockText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  clockWibText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#93C5FD',
    marginLeft: 4,
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
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeBoxLabel: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '500',
    marginBottom: 2,
  },
  timeBoxValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timeDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  locationText: {
    fontSize: 11,
    color: '#BFDBFE',
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 4,
  },
  checkInBtn: {
    backgroundColor: '#10B981', // Emerald green
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  checkInBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  checkOutBtn: {
    backgroundColor: '#D97706', // Amber
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  checkOutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  studentActionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  studentActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  completedBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6EE7B7',
  },
});

export default HighlightCard;
