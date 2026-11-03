import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, LogBox } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Sembunyikan seluruh banner warning development dari layar ponsel
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);
LogBox.ignoreAllLogs(true);
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import StudentScanScreen from './src/screens/StudentScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StudentHistoryScreen from './src/screens/StudentHistoryScreen';
import LeaveScreen from './src/screens/LeaveScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StudentLeaderboardScreen from './src/screens/StudentLeaderboardScreen';
import { Home, Calendar, User, ShieldCheck, Trophy } from 'lucide-react-native';

const MainApp = () => {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'history' | 'profile'
  const [activeModal, setActiveModal] = useState(null); // null | 'check-in' | 'scan-student' | 'student-history' | 'leave'
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);

  const refreshHome = () => {
    setHomeRefreshKey((k) => k + 1);
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen />
      </>
    );
  }

  // Active full-screen action screens (Camera / Scan)
  if (activeModal === 'check-in' || activeModal === 'check-out') {
    return (
      <>
        <StatusBar style="dark" />
        <CheckInScreen
          key={activeModal}
          mode={activeModal}
          onBack={() => {
            setActiveModal(null);
            refreshHome();
          }}
          onSuccess={() => {
            setActiveModal(null);
            refreshHome();
          }}
        />
      </>
    );
  }

  if (activeModal === 'scan-student') {
    return (
      <>
        <StatusBar style="dark" />
        <StudentScanScreen
          onBack={() => {
            setActiveModal(null);
            refreshHome();
          }}
        />
      </>
    );
  }

  if (activeModal === 'student-history') {
    return (
      <>
        <StatusBar style="dark" />
        <StudentHistoryScreen onBack={() => setActiveModal(null)} />
      </>
    );
  }

  if (activeModal === 'leave') {
    return (
      <>
        <StatusBar style="dark" />
        <LeaveScreen
          onBack={() => {
            setActiveModal(null);
            refreshHome();
          }}
        />
      </>
    );
  }

  const isStudent = user?.role === 'siswa' || !!user?.nis || user?.role_name === 'Siswa';

  // Render current active tab screen
  const renderScreen = () => {
    switch (currentTab) {
      case 'leaderboard':
        return (
          <StudentLeaderboardScreen
            onBack={() => setCurrentTab('home')}
            onNavigate={(screen) => {
              if (screen === 'history-tab') {
                setCurrentTab('history');
              } else if (screen === 'profile-tab') {
                setCurrentTab('profile');
              } else {
                setActiveModal(screen);
              }
            }}
            user={user}
            isStudent={isStudent}
          />
        );
      case 'history':
        return <HistoryScreen onBack={() => setCurrentTab('home')} />;
      case 'profile':
        return <ProfileScreen onBack={() => setCurrentTab('home')} />;
      default:
        return (
          <HomeScreen
            refreshTrigger={homeRefreshKey}
            onNavigate={(screen) => {
              if (screen === 'history-tab') {
                setCurrentTab('history');
              } else if (screen === 'profile-tab') {
                setCurrentTab('profile');
              } else if (screen === 'leaderboard-tab') {
                setCurrentTab('leaderboard');
              } else {
                setActiveModal(screen);
              }
            }}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('home')}
          activeOpacity={0.7}
        >
          <Home size={22} color={currentTab === 'home' ? '#2563EB' : '#94A3B8'} />
          <Text style={[styles.navLabel, currentTab === 'home' && styles.navLabelActive]}>
            Beranda
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('leaderboard')}
          activeOpacity={0.7}
        >
          <Trophy size={22} color={currentTab === 'leaderboard' ? '#023C69' : '#94A3B8'} />
          <Text style={[styles.navLabel, currentTab === 'leaderboard' && { color: '#023C69', fontWeight: '800' }]}>
            Peringkat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('history')}
          activeOpacity={0.7}
        >
          <Calendar size={22} color={currentTab === 'history' ? '#2563EB' : '#94A3B8'} />
          <Text style={[styles.navLabel, currentTab === 'history' && styles.navLabelActive]}>
            {isStudent ? 'Riwayat' : 'Riwayat Saya'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('profile')}
          activeOpacity={0.7}
        >
          <User size={22} color={currentTab === 'profile' ? '#2563EB' : '#94A3B8'} />
          <Text style={[styles.navLabel, currentTab === 'profile' && styles.navLabelActive]}>
            Profil
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
});

