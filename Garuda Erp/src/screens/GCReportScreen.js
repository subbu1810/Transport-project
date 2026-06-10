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

export default function GCReportScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [waybills, setWaybills] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  
  const today = new Date().toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({
    fromDate: today,
    toDate: today,
    status: '',
  });

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
        setSelectedBranchId(currentUser.branch_id || 'ALL');
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
    setWaybills([]);
    try {
      const params = {
        full_data: '1',
        from_date: filters.fromDate,
        to_date: filters.toDate,
      };
      
      if (filters.status) params.status = filters.status;
      if (user?.role !== 'superadmin' && user?.branch_id) {
        params.branch_id = user.branch_id;
      } else if (user?.role === 'superadmin' && selectedBranchId && selectedBranchId !== 'ALL') {
        params.branch_id = selectedBranchId;
      }

      const response = await api.get('/waybills', { params });
      if (response.data.success) {
        setWaybills(response.data.data);
        if (response.data.data.length === 0) {
          Alert.alert('No Data', 'No records found for the selected filters.');
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      Alert.alert('Error', 'Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  const renderWaybillCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.gcNumber}>{item.gc_number}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardRow}>
        <Ionicons name="calendar-outline" size={14} color="#64748b" />
        <Text style={styles.cardText}>{item.bill_date}</Text>
      </View>
      
      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={14} color="#64748b" />
        <Text style={styles.cardText}>
          {item.origin_branch?.branch_name || '-'} ➔ {item.destination?.city_name || '-'}
        </Text>
      </View>

      <View style={styles.partyContainer}>
        <View style={styles.partyBox}>
          <Text style={styles.partyLabel}>Consignor</Text>
          <Text style={styles.partyName} numberOfLines={1}>{item.consignor?.name || '-'}</Text>
        </View>
        <View style={styles.partyBox}>
          <Text style={styles.partyLabel}>Consignee</Text>
          <Text style={styles.partyName} numberOfLines={1}>{item.consignee?.name || '-'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.amountText}>₹{item.grand_total || 0}</Text>
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
        <Text style={styles.headerTitle}>GC Report</Text>
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
                  if (selectedDate) {
                    setFilters({ ...filters, fromDate: selectedDate.toISOString().split('T')[0] });
                  }
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
                  if (selectedDate) {
                    setFilters({ ...filters, toDate: selectedDate.toISOString().split('T')[0] });
                  }
                }}
              />
            )}
          </View>
        </View>

        {user?.role === 'superadmin' && (
          <>
            <Text style={styles.label}>Origin Branch</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBranchId}
                onValueChange={(val) => setSelectedBranchId(val)}
                style={styles.picker}
              >
                <Picker.Item label="All Branches" value="ALL" />
                {branches.map((b) => (
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
            <Picker.Item label="All Statuses" value="" />
            <Picker.Item label="Booked" value="Booked" />
            <Picker.Item label="Pending" value="PENDING" />
            <Picker.Item label="Received" value="RECEIVED" />
            <Picker.Item label="Inwarded" value="INWARDED" />
            <Picker.Item label="Dispatched" value="DISPATCHED" />
            <Picker.Item label="Delivered" value="DELIVERED" />
            <Picker.Item label="Cancelled" value="CANCELLED" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={fetchReport} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Get Details</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.resultsCount}>Found: {waybills.length} GCs</Text>
        <FlatList
          data={waybills}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWaybillCard}
          contentContainerStyle={{ paddingBottom: 20 }}
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
  
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },

  listContainer: { flex: 1, paddingHorizontal: 15 },
  resultsCount: { fontSize: 12, fontWeight: '700', color: '#64748b', marginVertical: 10, textTransform: 'uppercase' },
  
  card: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gcNumber: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  statusBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardText: { fontSize: 12, color: '#475569', marginLeft: 6, fontWeight: '600' },
  
  partyContainer: { flexDirection: 'row', gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  partyBox: { flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6 },
  partyLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  partyName: { fontSize: 11, fontWeight: '700', color: '#334155' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  amountText: { fontSize: 14, fontWeight: '900', color: '#059669' },
  articlesText: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#64748b', marginTop: 10 },
  emptySubText: { fontSize: 12, color: '#94a3b8', marginTop: 5 },
});
