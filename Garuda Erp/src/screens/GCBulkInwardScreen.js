import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  Alert, SafeAreaView, ActivityIndicator, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';

export default function GCBulkInwardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [originBranch, setOriginBranch] = useState('');
  const [inwardBranch, setInwardBranch] = useState('');
  
  const [waybills, setWaybills] = useState([]);
  const [selectedWaybills, setSelectedWaybills] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserAndBranches();
  }, []);

  useEffect(() => {
    if (originBranch && (inwardBranch || user?.branch_id)) {
      fetchWaybills();
    } else {
      setWaybills([]);
      setSelectedWaybills([]);
    }
  }, [originBranch, inwardBranch]);

  const loadUserAndBranches = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      let currentUser = null;
      if (userData) {
        currentUser = JSON.parse(userData);
        setUser(currentUser);
        setInwardBranch(currentUser.branch_id || '');
      }

      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load initial data', error);
      Alert.alert('Error', 'Failed to load branches.');
    }
  };

  const fetchWaybills = async () => {
    setLoading(true);
    try {
      let url = `/waybills?status=DISPATCHED`;
      
      if (originBranch !== 'ALL') {
        url += `&branch_id=${originBranch}`;
      }
      
      // Filter strictly for the current branch as the destination (like in web app)
      const branchToUse = inwardBranch || user?.branch_id;
      if (branchToUse) {
        url += `&destination_branch_id=${branchToUse}`;
      }

      const response = await api.get(url);
      if (response.data.success) {
        setWaybills(response.data.data);
        setSelectedWaybills([]); // Reset selection on new fetch
      } else {
        setWaybills([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch waybills.');
      setWaybills([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedWaybills.length === waybills.length && waybills.length > 0) {
      setSelectedWaybills([]);
    } else {
      setSelectedWaybills(waybills.map(wb => wb.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedWaybills.includes(id)) {
      setSelectedWaybills(prev => prev.filter(wbId => wbId !== id));
    } else {
      setSelectedWaybills(prev => [...prev, id]);
    }
  };

  const submitInward = async () => {
    if (selectedWaybills.length === 0) {
      Alert.alert('Validation', 'Please select at least one GC.');
      return;
    }

    const branchToUse = inwardBranch || user?.branch_id;
    if (!branchToUse) {
      Alert.alert('Error', 'Your branch ID is missing.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        waybill_ids: selectedWaybills,
        received_branch_id: branchToUse,
        received_date: new Date().toISOString().split('T')[0],
        remarks: "Bulk Inward from Manifest",
        inward_by: user.id
      };

      const response = await api.post('/waybills/bulk-inward', payload);
      
      if (response.data.success) {
        Alert.alert('Success', `Successfully inwarded ${selectedWaybills.length} GCs!`);
        setSelectedWaybills([]);
        fetchWaybills(); // Refresh the list
      } else {
        Alert.alert('Error', response.data.message || 'Failed to bulk inward.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Bulk Inward</Text>
          <Text style={styles.headerSubtitle}>From Manifest</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        
        {user?.role === 'superadmin' && (
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>Inward To Branch <Text style={{color: 'red'}}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="business" size={20} color="#059669" style={styles.pickerIcon} />
              <Picker
                selectedValue={inwardBranch}
                onValueChange={(itemValue) => setInwardBranch(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Inward Branch" value="" />
                {branches.map((branch) => (
                  <Picker.Item key={branch.id} label={branch.branch_name} value={branch.id.toString()} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Origin Branch Selector */}
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>Select Origin Branch</Text>
          <View style={styles.pickerContainer}>
            <Ionicons name="location" size={20} color="#059669" style={styles.pickerIcon} />
            <Picker
              selectedValue={originBranch}
              onValueChange={(itemValue) => setOriginBranch(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Origin" value="" />
              <Picker.Item label="All Branches" value="ALL" />
              {branches.map((branch) => (
                <Picker.Item key={branch.id} label={branch.branch_name} value={branch.id.toString()} />
              ))}
            </Picker>
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listContainer}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitle}>
              Pending GCs <Text style={styles.badgeText}>({waybills.length})</Text>
            </Text>
            {waybills.length > 0 && (
              <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllBtn}>
                <Ionicons 
                  name={selectedWaybills.length === waybills.length ? "checkbox" : "square-outline"} 
                  size={20} 
                  color="#059669" 
                />
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#059669" />
            </View>
          ) : !originBranch ? (
            <View style={styles.emptyState}>
              <Ionicons name="filter-circle" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>Select an Origin Branch</Text>
              <Text style={styles.emptySubText}>Choose where the goods are coming from to view the manifest.</Text>
            </View>
          ) : waybills.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>Manifest Empty</Text>
              <Text style={styles.emptySubText}>No pending deliveries found from this branch.</Text>
            </View>
          ) : (
            <FlatList 
              data={waybills}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSelected = selectedWaybills.includes(item.id);
                return (
                  <TouchableOpacity 
                    style={[styles.gcCard, isSelected && styles.gcCardSelected]} 
                    onPress={() => toggleSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={isSelected ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={isSelected ? "#059669" : "#94a3b8"} 
                      style={styles.checkboxIcon}
                    />
                    <View style={styles.gcInfo}>
                      <View style={styles.gcRow1}>
                        <Text style={styles.gcNumber}>{item.gc_number}</Text>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>{item.status}</Text>
                        </View>
                      </View>
                      <View style={styles.gcRow2}>
                        <Ionicons name="person-outline" size={12} color="#64748b" />
                        <Text style={styles.gcParty} numberOfLines={1}>
                          {item.consignor?.name || 'N/A'} ➔ {item.consignee?.name || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.gcRow3}>
                        <Text style={styles.gcDetail}>Qty: {item.total_articles}</Text>
                        <Text style={styles.gcDetail}>₹{parseFloat(item.total_amount || 0).toLocaleString()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* Submit Footer */}
        {waybills.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.submitBtn, (selectedWaybills.length === 0 || submitting) && styles.submitBtnDisabled]}
              onPress={submitInward}
              disabled={selectedWaybills.length === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Receive {selectedWaybills.length} GCs</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center'
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  headerSubtitle: { fontSize: 10, fontWeight: '700', color: '#059669', textAlign: 'center', textTransform: 'uppercase', marginTop: 2 },
  backBtn: { padding: 4 },
  
  container: { flex: 1, padding: 15 },
  
  filterCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  filterLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  pickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  pickerIcon: { paddingLeft: 12 },
  picker: { flex: 1, height: 50 },

  listContainer: { flex: 1 },
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  badgeText: { color: '#059669', fontSize: 14 },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#d1fae5' },
  selectAllText: { color: '#059669', fontWeight: '800', fontSize: 12, marginLeft: 4 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#64748b', marginTop: 15 },
  emptySubText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },

  gcCard: { flexDirection: 'row', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  gcCardSelected: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  checkboxIcon: { marginRight: 12, marginTop: 2 },
  gcInfo: { flex: 1 },
  gcRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  gcNumber: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
  statusBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' },
  statusText: { fontSize: 9, fontWeight: '800', color: '#d97706', letterSpacing: 0.5 },
  
  gcRow2: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  gcParty: { fontSize: 12, color: '#475569', marginLeft: 4, fontWeight: '600', flex: 1 },
  
  gcRow3: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  gcDetail: { fontSize: 12, fontWeight: '800', color: '#0f172a' },

  footer: { paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  submitBtn: { backgroundColor: '#059669', paddingVertical: 18, borderRadius: 12, alignItems: 'center', elevation: 2 },
  submitBtnDisabled: { backgroundColor: '#a7f3d0', elevation: 0 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
});
