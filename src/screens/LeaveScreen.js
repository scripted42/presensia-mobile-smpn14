import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  FileText,
  PlusCircle,
  X,
  Camera,
  Image as ImageIcon,
  Check,
  Trash2,
  HeartPulse,
  Briefcase,
  Palmtree,
  ShieldAlert,
  UserCheck,
  TrendingUp,
  Inbox,
} from 'lucide-react-native';

const LeaveScreen = ({ onBack }) => {
  const { user } = useAuth();

  // Active Tab: 'my_leaves' | 'apply' | 'approvals'
  const [activeTab, setActiveTab] = useState('my_leaves');

  // Loading & data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [canApprove, setCanApprove] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Filter for 'my_leaves'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // Photo viewer modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);

  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Form states for 'apply'
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [formType, setFormType] = useState('sick'); // 'sick' | 'leave' | 'duty'
  const [formStartDate, setFormStartDate] = useState(getTodayStr());
  const [formEndDate, setFormEndDate] = useState(getTodayStr());
  const [formReason, setFormReason] = useState('');
  const [formPhoto, setFormPhoto] = useState(null); // { uri, name, type }

  // Fetch leave requests data from server
  const fetchLeaveData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/leave-requests');
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setMyLeaves(data.my_leaves || []);
        setApprovals(data.approvals || []);
        setCanApprove(Boolean(data.can_approve));
        if (data.statistics) {
          setStats(data.statistics);
        }
      }
    } catch (e) {
      console.log('Gagal memuat data permohonan izin:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaveData();
  };

  // Calculate day duration between start and end date
  const calculateDurationDays = (start, end) => {
    try {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch (_) {
      return 1;
    }
  };

  const formDuration = useMemo(() => {
    return calculateDurationDays(formStartDate, formEndDate);
  }, [formStartDate, formEndDate]);

  // Image picking handlers
  const handlePickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Dibutuhkan', 'Mohon izinkan akses kamera untuk memfoto surat izin.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFormPhoto({
          uri: asset.uri,
          name: 'evidence_' + Date.now() + '.jpg',
          type: 'image/jpeg',
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal membuka kamera: ' + e?.message);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Dibutuhkan', 'Mohon izinkan akses galeri untuk memilih surat izin.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFormPhoto({
          uri: asset.uri,
          name: 'evidence_' + Date.now() + '.jpg',
          type: 'image/jpeg',
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal membuka galeri: ' + e?.message);
    }
  };

  // Submit leave request handler
  const handleSubmitLeave = async () => {
    if (!formReason.trim()) {
      Alert.alert('Peringatan', 'Mohon isi alasan permohonan izin / cuti Anda.');
      return;
    }

    if (formStartDate > formEndDate) {
      Alert.alert('Peringatan', 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('type', formType);
      formData.append('start_date', formStartDate);
      formData.append('end_date', formEndDate);
      formData.append('reason', formReason.trim());

      if (formPhoto) {
        formData.append('evidence', {
          uri: formPhoto.uri,
          name: formPhoto.name,
          type: formPhoto.type,
        });
      }

      const res = await client.post('/leave-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        Alert.alert('Berhasil', 'Permohonan izin Anda berhasil diajukan dan sedang menunggu persetujuan.');
        // Reset form
        setFormReason('');
        setFormPhoto(null);
        setActiveTab('my_leaves');
        fetchLeaveData();
      } else {
        Alert.alert('Gagal', res.data?.message || 'Terjadi kesalahan saat mengajukan izin.');
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Gagal mengajukan izin.';
      Alert.alert('Gagal Mengajukan', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel pending leave request
  const handleCancelLeave = (id) => {
    Alert.alert(
      'Batalkan Permohonan',
      'Apakah Anda yakin ingin membatalkan permohonan izin ini?',
      [
        { text: 'Tidak', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await client.delete(`/leave-requests/${id}`);
              if (res.data?.success) {
                Alert.alert('Dibatalkan', 'Permohonan izin berhasil dibatalkan.');
                fetchLeaveData();
              }
            } catch (e) {
              Alert.alert('Gagal', e?.response?.data?.message || 'Gagal membatalkan permohonan.');
            }
          },
        },
      ]
    );
  };

  // Approve leave request handler
  const handleApproveLeave = (id, requesterName) => {
    Alert.alert(
      'Setujui Permohonan',
      `Setujui permohonan izin untuk ${requesterName}? Sistem akan otomatis mencatat data presensi.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Setujui',
          onPress: async () => {
            try {
              const res = await client.post(`/leave-requests/${id}/approve`);
              if (res.data?.success) {
                Alert.alert('Disetujui', 'Permohonan berhasil disetujui.');
                fetchLeaveData();
              }
            } catch (e) {
              Alert.alert('Gagal', e?.response?.data?.message || 'Gagal menyetujui permohonan.');
            }
          },
        },
      ]
    );
  };

  // Reject leave request handler
  const openRejectModal = (id) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Peringatan', 'Mohon isi alasan penolakan.');
      return;
    }

    try {
      setRejecting(true);
      const res = await client.post(`/leave-requests/${rejectTargetId}/reject`, {
        rejection_reason: rejectReason.trim(),
      });

      if (res.data?.success) {
        setRejectModalVisible(false);
        Alert.alert('Ditolak', 'Permohonan izin telah ditolak.');
        fetchLeaveData();
      }
    } catch (e) {
      Alert.alert('Gagal', e?.response?.data?.message || 'Gagal menolak permohonan.');
    } finally {
      setRejecting(false);
    }
  };

  // Type styling helpers
  const getTypeBadge = (type) => {
    switch (type) {
      case 'sick':
        return { label: 'Sakit', icon: HeartPulse, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
      case 'duty':
        return { label: 'Dinas Luar', icon: Briefcase, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' };
      default:
        return { label: 'Cuti / Izin', icon: Palmtree, color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { label: 'Disetujui', color: '#059669', bg: '#ECFDF5', dot: '#10B981' };
      case 'rejected':
        return { label: 'Ditolak', color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' };
      default:
        return { label: 'Menunggu', color: '#D97706', bg: '#FEF3C7', dot: '#F59E0B' };
    }
  };

  // Filtered personal leaves
  const filteredMyLeaves = useMemo(() => {
    if (statusFilter === 'all') return myLeaves;
    return myLeaves.filter((item) => item.status === statusFilter);
  }, [myLeaves, statusFilter]);

  // Format date helper: YYYY-MM-DD -> DD MMMM YYYY
  const formatDateID = (dStr) => {
    if (!dStr) return '-';
    try {
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch (_) {}
    return dStr;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle}>Izin & Cuti</Text>
          <Text style={styles.topBarSub}>Pengajuan & Riwayat Ketidakhadiran</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Main Segmented Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my_leaves' && styles.tabBtnActive]}
          onPress={() => setActiveTab('my_leaves')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'my_leaves' && styles.tabBtnTextActive]}>
            Riwayat Saya
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'apply' && styles.tabBtnActive]}
          onPress={() => setActiveTab('apply')}
        >
          <PlusCircle size={14} color={activeTab === 'apply' ? '#2563EB' : '#64748B'} style={{ marginRight: 4 }} />
          <Text style={[styles.tabBtnText, activeTab === 'apply' && styles.tabBtnTextActive]}>
            Ajukan Izin
          </Text>
        </TouchableOpacity>

        {canApprove && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'approvals' && styles.tabBtnActive]}
            onPress={() => setActiveTab('approvals')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'approvals' && styles.tabBtnTextActive]}>
              Persetujuan
            </Text>
            {approvals.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{approvals.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ========================================================
          TAB 1: RIWAYAT SAYA
          ======================================================== */}
      {activeTab === 'my_leaves' && (
        <View style={{ flex: 1 }}>
          {/* Header with KPI & Filters */}
          <View style={styles.myLeavesHeader}>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiBox, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                <Text style={[styles.kpiNum, { color: '#0F172A' }]}>{stats.total}</Text>
                <Text style={styles.kpiLabel}>Total</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Text style={[styles.kpiNum, { color: '#92400E' }]}>{stats.pending}</Text>
                <Text style={[styles.kpiLabel, { color: '#B45309' }]}>Menunggu</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Text style={[styles.kpiNum, { color: '#065F46' }]}>{stats.approved}</Text>
                <Text style={[styles.kpiLabel, { color: '#047857' }]}>Disetujui</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={[styles.kpiNum, { color: '#991B1B' }]}>{stats.rejected}</Text>
                <Text style={[styles.kpiLabel, { color: '#DC2626' }]}>Ditolak</Text>
              </View>
            </View>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                  Semua ({myLeaves.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, statusFilter === 'pending' && styles.chipActiveYellow]}
                onPress={() => setStatusFilter('pending')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'pending' && styles.chipTextActiveYellow]}>
                  Menunggu ({stats.pending})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, statusFilter === 'approved' && styles.chipActiveGreen]}
                onPress={() => setStatusFilter('approved')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'approved' && styles.chipTextActiveGreen]}>
                  Disetujui ({stats.approved})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, statusFilter === 'rejected' && styles.chipActiveRed]}
                onPress={() => setStatusFilter('rejected')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'rejected' && styles.chipTextActiveRed]}>
                  Ditolak ({stats.rejected})
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* List of Leave Requests */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Memuat riwayat izin...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMyLeaves}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Inbox size={48} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyTitle}>Belum Ada Pengajuan Izin</Text>
                  <Text style={styles.emptySub}>
                    {statusFilter !== 'all'
                      ? 'Tidak ada permohonan dengan status yang dipilih.'
                      : 'Anda belum pernah mengajukan izin atau cuti. Ketuk tombol "Ajukan Izin" di atas untuk membuat pengajuan baru.'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const typeB = getTypeBadge(item.type);
                const statusB = getStatusBadge(item.status);
                const TypeIcon = typeB.icon;

                return (
                  <View style={styles.leaveCard}>
                    {/* Header: Type Badge & Status Badge */}
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.typeBadge, { backgroundColor: typeB.bg, borderColor: typeB.border }]}>
                        <TypeIcon size={12} color={typeB.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.typeBadgeText, { color: typeB.color }]}>{typeB.label}</Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: statusB.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusB.dot }]} />
                        <Text style={[styles.statusBadgeText, { color: statusB.color }]}>{statusB.label}</Text>
                      </View>
                    </View>

                    {/* Date Range & Duration */}
                    <View style={styles.dateRangeBox}>
                      <Calendar size={14} color="#2563EB" style={{ marginRight: 6 }} />
                      <Text style={styles.dateRangeText}>
                        {formatDateID(item.start_date)} - {formatDateID(item.end_date)}
                      </Text>
                      <View style={styles.durationPill}>
                        <Text style={styles.durationPillText}>{item.duration_days} Hari</Text>
                      </View>
                    </View>

                    {/* Reason */}
                    <Text style={styles.reasonText}>{item.reason}</Text>

                    {/* Rejection Note if rejected */}
                    {item.rejection_reason ? (
                      <View style={styles.rejectionBox}>
                        <ShieldAlert size={14} color="#DC2626" style={{ marginRight: 6 }} />
                        <Text style={styles.rejectionText}>
                          Alasan Ditolak: {item.rejection_reason}
                        </Text>
                      </View>
                    ) : null}

                    {/* Footer: Evidence link, approver info, and cancel btn */}
                    <View style={styles.cardFooterRow}>
                      {item.evidence_urls && item.evidence_urls.length > 0 ? (
                        <TouchableOpacity
                          style={styles.evidenceBtn}
                          onPress={() => setPreviewPhotoUrl(item.evidence_urls[0])}
                        >
                          <Camera size={12} color="#2563EB" style={{ marginRight: 4 }} />
                          <Text style={styles.evidenceBtnText}>Lihat Surat Bukti</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}

                      {/* Cancel button if pending */}
                      {item.status === 'pending' && (
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => handleCancelLeave(item.id)}
                        >
                          <Trash2 size={12} color="#DC2626" style={{ marginRight: 4 }} />
                          <Text style={styles.cancelBtnText}>Batalkan</Text>
                        </TouchableOpacity>
                      )}

                      {/* Approved Info */}
                      {item.status === 'approved' && item.approved_by_name && (
                        <Text style={styles.approverInfoText}>
                          Disetujui oleh {item.approved_by_name}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* ========================================================
          TAB 2: AJUKAN IZIN / CUTI FORM
          ======================================================== */}
      {activeTab === 'apply' && (
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.formCard}>
            <Text style={styles.formHeaderTitle}>Form Pengajuan Ketidakhadiran</Text>
            <Text style={styles.formHeaderSub}>
              Isi formulir di bawah ini dengan lengkap untuk mengajukan izin, cuti, atau dinas luar.
            </Text>

            {/* 1. Pilih Jenis */}
            <Text style={styles.inputSectionLabel}>1. Jenis Permohonan</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeOptionCard, formType === 'sick' && styles.typeOptionActiveRed]}
                onPress={() => setFormType('sick')}
              >
                <HeartPulse size={20} color={formType === 'sick' ? '#DC2626' : '#64748B'} />
                <Text style={[styles.typeOptionTitle, formType === 'sick' && { color: '#DC2626' }]}>Sakit</Text>
                <Text style={styles.typeOptionDesc}>Surat Dokter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOptionCard, formType === 'leave' && styles.typeOptionActiveOrange]}
                onPress={() => setFormType('leave')}
              >
                <Palmtree size={20} color={formType === 'leave' ? '#D97706' : '#64748B'} />
                <Text style={[styles.typeOptionTitle, formType === 'leave' && { color: '#D97706' }]}>Cuti / Izin</Text>
                <Text style={styles.typeOptionDesc}>Keperluan Pribadi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOptionCard, formType === 'duty' && styles.typeOptionActiveBlue]}
                onPress={() => setFormType('duty')}
              >
                <Briefcase size={20} color={formType === 'duty' ? '#2563EB' : '#64748B'} />
                <Text style={[styles.typeOptionTitle, formType === 'duty' && { color: '#2563EB' }]}>Dinas Luar</Text>
                <Text style={styles.typeOptionDesc}>Tugas Sekolah</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Rentang Tanggal */}
            <Text style={styles.inputSectionLabel}>2. Rentang Tanggal Izin</Text>
            <View style={styles.dateInputsRow}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Tanggal Mulai</Text>
                <TextInput
                  style={styles.dateInput}
                  value={formStartDate}
                  onChangeText={setFormStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Tanggal Selesai</Text>
                <TextInput
                  style={styles.dateInput}
                  value={formEndDate}
                  onChangeText={setFormEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.durationBanner}>
              <Clock size={14} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={styles.durationBannerText}>
                Estimasi Durasi: <Text style={{ fontWeight: '800' }}>{formDuration} Hari</Text>
              </Text>
            </View>

            {/* 3. Alasan / Keterangan */}
            <Text style={styles.inputSectionLabel}>3. Alasan & Keterangan</Text>
            <TextInput
              style={styles.textAreaInput}
              placeholder="Jelaskan alasan izin / sakit / cuti Anda secara jelas..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formReason}
              onChangeText={setFormReason}
            />

            {/* 4. Lampiran Bukti / Surat Dokter */}
            <Text style={styles.inputSectionLabel}>
              4. Lampiran Foto Surat Bukti {formType === 'sick' ? '(Surat Dokter)' : '(Opsional)'}
            </Text>

            {formPhoto ? (
              <View style={styles.photoPreviewCard}>
                <Image source={{ uri: formPhoto.uri }} style={styles.photoThumbImg} />
                <View style={styles.photoInfoCol}>
                  <Text style={styles.photoInfoTitle} numberOfLines={1}>{formPhoto.name}</Text>
                  <Text style={styles.photoInfoSub}>Foto siap dilampirkan</Text>
                </View>
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setFormPhoto(null)}
                >
                  <X size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadRow}>
                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFromCamera}>
                  <Camera size={18} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadBtnText}>Ambil Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFromGallery}>
                  <ImageIcon size={18} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadBtnText}>Pilih Galeri</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmitLeave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Kirim Permohonan Izin</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ========================================================
          TAB 3: PERSETUJUAN (GURU / ADMIN ONLY)
          ======================================================== */}
      {activeTab === 'approvals' && canApprove && (
        <View style={{ flex: 1 }}>
          <View style={styles.approvalHeaderBar}>
            <Text style={styles.approvalHeaderTitle}>
              Permohonan Menunggu Verifikasi ({approvals.length})
            </Text>
            <Text style={styles.approvalHeaderSub}>
              Verifikasi permohonan izin dari siswa atau staf Anda.
            </Text>
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Memuat permohonan...</Text>
            </View>
          ) : (
            <FlatList
              data={approvals}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyTitle}>Semua Pengajuan Telah Diverifikasi</Text>
                  <Text style={styles.emptySub}>
                    Tidak ada permohonan izin yang sedang menunggu persetujuan saat ini.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const typeB = getTypeBadge(item.type);
                const TypeIcon = typeB.icon;

                return (
                  <View style={styles.approvalCard}>
                    {/* Top: User info + Type */}
                    <View style={styles.approvalTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.approvalUserName}>{item.user_name || 'Pengguna'}</Text>
                        <Text style={styles.approvalUserSub}>
                          {item.user_type === 'student' ? `Siswa • ${item.class_name || 'Kelas'}` : 'Guru / Pegawai'}
                          {item.user_nis ? ` • NIS: ${item.user_nis}` : ''}
                        </Text>
                      </View>

                      <View style={[styles.typeBadge, { backgroundColor: typeB.bg, borderColor: typeB.border }]}>
                        <TypeIcon size={12} color={typeB.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.typeBadgeText, { color: typeB.color }]}>{typeB.label}</Text>
                      </View>
                    </View>

                    {/* Date info */}
                    <View style={styles.dateRangeBox}>
                      <Calendar size={14} color="#2563EB" style={{ marginRight: 6 }} />
                      <Text style={styles.dateRangeText}>
                        {formatDateID(item.start_date)} - {formatDateID(item.end_date)}
                      </Text>
                      <View style={styles.durationPill}>
                        <Text style={styles.durationPillText}>{item.duration_days} Hari</Text>
                      </View>
                    </View>

                    {/* Reason */}
                    <Text style={styles.approvalReasonText}>"{item.reason}"</Text>

                    {/* Evidence if any */}
                    {item.evidence_urls && item.evidence_urls.length > 0 && (
                      <TouchableOpacity
                        style={styles.evidenceBtn}
                        onPress={() => setPreviewPhotoUrl(item.evidence_urls[0])}
                      >
                        <Camera size={12} color="#2563EB" style={{ marginRight: 4 }} />
                        <Text style={styles.evidenceBtnText}>Lihat Lampiran Surat</Text>
                      </TouchableOpacity>
                    )}

                    {/* Action buttons: Setujui vs Tolak */}
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => openRejectModal(item.id)}
                      >
                        <X size={15} color="#DC2626" style={{ marginRight: 4 }} />
                        <Text style={styles.rejectBtnText}>Tolak</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApproveLeave(item.id, item.user_name)}
                      >
                        <Check size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.approveBtnText}>Setujui</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.rejectModalCard}>
            <Text style={styles.rejectModalTitle}>Alasan Penolakan</Text>
            <Text style={styles.rejectModalSub}>
              Tuliskan alasan mengapa permohonan izin ini tidak disetujui:
            </Text>
            <TextInput
              style={styles.rejectTextInput}
              placeholder="Contoh: Bukti surat tidak valid, masa cuti habis..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.rejectModalActionRow}>
              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.rejectCancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectConfirmBtn}
                onPress={handleConfirmReject}
                disabled={rejecting}
              >
                {rejecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.rejectConfirmBtnText}>Tolak Izin</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Preview Modal */}
      <Modal visible={!!previewPhotoUrl} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewPhotoUrl(null)}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {previewPhotoUrl && (
            <View style={styles.modalImageWrapper}>
              <Image source={{ uri: previewPhotoUrl }} style={styles.modalFullImage} resizeMode="contain" />
              <Text style={styles.modalImageCaption}>Lampiran Bukti Surat Izin</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  myLeavesHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  kpiBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipActiveYellow: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  chipTextActiveYellow: {
    color: '#92400E',
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
  chipActiveRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  chipTextActiveRed: {
    color: '#991B1B',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  leaveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
  dateRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  dateRangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  durationPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  reasonText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 8,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  rejectionText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  evidenceBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  approverInfoText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  formHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  formHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 16,
  },
  inputSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeOptionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  typeOptionActiveRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  typeOptionActiveOrange: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  typeOptionActiveBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  typeOptionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  typeOptionDesc: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  durationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  durationBannerText: {
    fontSize: 11,
    color: '#2563EB',
  },
  textAreaInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 80,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  photoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  photoThumbImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  photoInfoCol: {
    flex: 1,
  },
  photoInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  photoInfoSub: {
    fontSize: 10,
    color: '#059669',
  },
  removePhotoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  approvalHeaderBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  approvalHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  approvalHeaderSub: {
    fontSize: 11,
    color: '#64748B',
  },
  approvalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  approvalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  approvalUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  approvalUserSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  approvalReasonText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#334155',
    marginBottom: 8,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  rejectModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '92%',
  },
  rejectModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  rejectModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  rejectTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    marginBottom: 16,
  },
  rejectModalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  rejectCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  rejectConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
  },
  rejectConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default LeaveScreen;
