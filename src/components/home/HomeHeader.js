import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Bell, LogOut } from 'lucide-react-native';

const HomeHeader = ({ user, isStudent, insets, onLogout, onNotificationPress, hasUnreadNotification = false }) => {
  // Sapaan dinamis berdasarkan jam saat ini
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const initials = (user?.name || 'User')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const getRoleLabel = () => {
    if (isStudent) return 'Siswa';
    if (user?.user_type === 'employee') return 'Guru / Pegawai';
    return 'Staff';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        {/* Avatar Profil Kiri */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Info Pengguna & Sapaan */}
        <View style={styles.userInfoCol}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{getRoleLabel()}</Text>
            </View>
          </View>
          <Text style={styles.userNameText} numberOfLines={1}>
            {user?.name || 'Pengguna'}
          </Text>
          <Text style={styles.dateText}>{todayFormatted}</Text>
        </View>

        {/* Aksi Kanan: Notification Bell & Logout */}
        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Bell size={20} color="#334155" />
            {hasUnreadNotification && <View style={styles.notificationDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, styles.logoutBtn]}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <LogOut size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  userInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  roleChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
});

export default HomeHeader;
