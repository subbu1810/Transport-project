import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, SafeAreaView, TextInput, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';

export default function InwardReportScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inwards, setInwards] = useState([]);
  const [summary, setSummary] = useState(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({
    fromDate: today,
    toDate: today,
    status: 'All',
  });

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const currentUser = JSON.parse(userData);
        setUser(currentUser);
        setSelectedBranchId(currentUser.role === 'superadmin' ? 'ALL' : (currentUser.branch_id ? currentUser.branch_id.toString() : 'ALL'));
      }

      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load user or branches', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setInwards([]);
    setSummary(null);
    try {
      const params = {
        from_date: filters.fromDate,
        to_date: filters.toDate,
      };
      
      if (filters.status && filters.status !== 'All') {
        params.status = filters.status;
      }
      
      if (user?.role !== 'superadmin' && user?.branch_id) {
        params.inward_branch_id = user.branch_id;
      } else if (user?.role === 'superadmin' && selectedBranchId && selectedBranchId !== 'ALL') {
        params.inward_branch_id = selectedBranchId;
      }

      const response = await api.get('/reports/inward-status', { params });
      
      if (response.data.success) {
        setInwards(response.data.data || []);
        setSummary(response.data.summary || null);
        if ((response.data.data || []).length === 0) {
          Alert.alert('No Data', 'No inward records found for the selected dates.');
        }
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch report.');
      }
    } catch (error) {
      console.error('Error fetching inward report:', error);
      Alert.alert('Error', getErrorMessage(error, 'Connection failure. Check if backend is running.'));
    } finally {
      setLoading(false);
    }
  };

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.gcNumber}>{item.gc_number}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status || 'PENDING'}</Text>
        </View>
      </View>
      
      <View style={styles.cardRow}>
        <Ionicons name="time-outline" size={14} color="#64748b" />
        <Text style={styles.cardText}>
          {item.inward_at ? new Date(item.inward_at).toLocaleString() : 'N/A'}
        </Text>
      </View>
      
      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={14} color="#64748b" />
        <Text style={styles.cardText}>
          {item.origin_branch?.branch_name || 'N/A'} ➔ {item.destination?.city_name || 'N/A'}
        </Text>
      </View>

      <View style={styles.partyContainer}>
        <Text style={styles.partyLabel}>Consignee</Text>
        <Text style={styles.partyName} numberOfLines={1}>{item.consignee?.name || 'N/A'}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.amountText}>To Pay: ₹{parseFloat(item.account_type === 'topay' ? item.grand_total : 0).toLocaleString()}</Text>
        <Text style={styles.articlesText}>{item.total_articles || 0} Articles</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inward Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterCol}>
            <Text style={styles.label}>From Date</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowFromPicker(true)}>
              <Text style={styles.inputText}>{filters.fromDate}</Text>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>
            {showFromPicker && (
              <DateTimePicker
                value={new Date(filters.fromDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowFromPicker(false);
                  if (selectedDate) setFilters({ ...filters, fromDate: selectedDate.toISOString().split('T')[0] });
                }}
              />
            )}
          </View>
          <View style={styles.filterCol}>
            <Text style={styles.label}>To Date</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowToPicker(true)}>
              <Text style={styles.inputText}>{filters.toDate}</Text>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>
            {showToPicker && (
              <DateTimePicker
                value={new Date(filters.toDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowToPicker(false);
                  if (selectedDate) setFilters({ ...filters, toDate: selectedDate.toISOString().split('T')[0] });
                }}
              />
            )}
          </View>
        </View>

        {user?.role === 'superadmin' && (
          <>
            <Text style={styles.label}>Inward Branch</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBranchId}
                onValueChange={(val) => setSelectedBranchId(val)}
                style={styles.picker}
              >
                <Picker.Item label="All Branches" value="ALL" />
                {branches.map(b => (
                  <Picker.Item key={b.id} label={b.branch_name} value={b.id.toString()} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={filters.status}
            onValueChange={(val) => setFilters({...filters, status: val})}
            style={styles.picker}
          >
            <Picker.Item label="All Transactions" value="All" />
            <Picker.Item label="Inwarded (Stock)" value="INWARDED" />
            <Picker.Item label="Out for Delivery" value="LOCAL_TRIP" />
            <Picker.Item label="Delivered History" value="DELIVERED" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={fetchReport} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Get Details</Text>}
        </TouchableOpacity>
      </View>

      {summary && inwards.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total GCs</Text>
            <Text style={styles.summaryValue}>{summary.total_count}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Articles</Text>
            <Text style={styles.summaryValue}>{summary.total_articles}</Text>
          </View>
        </View>
      )}

      <View style={styles.listContainer}>
        <FlatList
          data={inwards}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCard}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No reports to show.</Text>
                <Text style={styles.emptySubText}>Adjust filters and tap "Get Details".</Text>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  backBtn: { padding: 4 },
  
  filterContainer: { padding: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  filterCol: { flex: 1 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 14, color: '#0f172a', fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, height: 40 },
  inputText: { fontSize: 14, color: '#0f172a', fontWeight: '600' },
  
  pickerContainer: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 15, overflow: 'hidden' },
  picker: { height: 40 },
  
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },

  summaryContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#eef2ff', borderBottomWidth: 1, borderBottomColor: '#e0e7ff' },
  summaryBox: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#6366f1', fontWeight: '800', textTransform: 'uppercase' },
  summaryValue: { fontSize: 20, fontWeight: '900', color: '#312e81' },

  listContainer: { flex: 1, paddingHorizontal: 15 },
  
  card: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gcNumber: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  statusBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase' },
  
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardText: { fontSize: 12, color: '#475569', marginLeft: 6, fontWeight: '600' },
  
  partyContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  partyLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  partyName: { fontSize: 12, fontWeight: '700', color: '#334155' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  amountText: { fontSize: 14, fontWeight: '900', color: '#e11d48' },
  articlesText: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#64748b', marginTop: 10 },
  emptySubText: { fontSize: 12, color: '#94a3b8', marginTop: 5 },
});
