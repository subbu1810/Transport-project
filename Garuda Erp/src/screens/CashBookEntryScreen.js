import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, SafeAreaView, TextInput, Alert, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';

export default function CashBookEntryScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [heads, setHeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showTransactionDatePicker, setShowTransactionDatePicker] = useState(false);
  const [showRefDatePicker, setShowRefDatePicker] = useState(false);

  const [currentEntry, setCurrentEntry] = useState({
    id: '', voucher_no: '', transaction_date: today, transaction_type: 'CREDIT',
    account_head_id: '', amount: '', branch_id: '', paid_to_receive_from: '',
    mode_of_pay: 'Cash', dd_cheque_no: '', dd_cheque_date: today, drawn_on_bank: '',
    authorised_by: '', paid_by_received_by: '', remarks: ''
  });

  useEffect(() => {
    loadUser();
    fetchHeads();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, fromDate, toDate, searchQuery, selectedBranchId]);

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

  const fetchHeads = async () => {
    try {
      const response = await api.get('/account-heads');
      if (response.data.success) {
        setHeads(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching account heads:', error);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = { from_date: fromDate, to_date: toDate, search: searchQuery };
      if (user?.role !== 'superadmin' && user?.branch_id) {
        params.branch_id = user.branch_id;
      } else if (user?.role === 'superadmin' && selectedBranchId && selectedBranchId !== 'ALL') {
        params.branch_id = selectedBranchId;
      }
      
      const response = await api.get('/cash-book', { params });
      if (response.data.success) {
        setEntries(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (entry = null) => {
    if (entry) {
      setCurrentEntry({
        ...entry,
        transaction_date: entry.transaction_date,
        transaction_type: entry.transaction_type,
      });
      setIsEditing(true);
    } else {
      setCurrentEntry({
        id: '',
        voucher_no: `VCH-${Date.now().toString().slice(-6)}`,
        transaction_date: toDate,
        transaction_type: 'CREDIT',
        account_head_id: '',
        amount: '',
        branch_id: user?.branch_id || '',
        paid_to_receive_from: '',
        mode_of_pay: 'Cash',
        dd_cheque_no: '',
        dd_cheque_date: today,
        drawn_on_bank: '',
        authorised_by: '',
        paid_by_received_by: '',
        remarks: ''
      });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!currentEntry.transaction_type || !currentEntry.account_head_id || !currentEntry.amount) {
      Alert.alert('Validation Error', 'Please fill in Type, Account Head, and Amount.');
      return;
    }
    if (!currentEntry.branch_id) {
      Alert.alert('Validation Error', 'Please select a branch for this entry.');
      return;
    }
    if ((currentEntry.mode_of_pay === 'Cheque' || currentEntry.mode_of_pay === 'DD') && (!currentEntry.dd_cheque_no || !currentEntry.dd_cheque_date)) {
      Alert.alert('Validation Error', `Please enter ${currentEntry.mode_of_pay} Number and Date.`);
      return;
    }

    setSaving(true);
    try {
      const url = isEditing ? `/cash-book/${currentEntry.id}` : '/cash-book';
      const method = isEditing ? 'put' : 'post';

      const response = await api[method](url, currentEntry);
      if (response.data.success) {
        Alert.alert('Success', isEditing ? 'Entry updated successfully!' : 'Entry saved successfully!');
        setShowModal(false);
        fetchEntries();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to save entry.');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to communicate with server.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const response = await api.delete(`/cash-book/${id}`);
            if (response.data.success) {
              Alert.alert('Success', 'Entry deleted successfully.');
              fetchEntries();
            } else {
              Alert.alert('Error', response.data.message || 'Failed to delete.');
            }
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', getErrorMessage(error, 'Failed to communicate with server.'));
          }
      }}
    ]);
  };

  const renderEntry = ({ item, index }) => {
    const balance = entries.slice(0, index + 1).reduce((acc, curr) => {
      return curr.transaction_type === 'CREDIT' ? acc + Number(curr.amount) : acc - Number(curr.amount);
    }, 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.voucherNo}>{item.voucher_no}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={16} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.accountHead}>{item.account_head?.name || 'Unknown Head'}</Text>
        <Text style={styles.remarks} numberOfLines={2}>Remarks: {item.remarks || 'N/A'}</Text>
        
        <View style={styles.amountsRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>CREDIT</Text>
            <Text style={[styles.amountValue, { color: '#10b981' }]}>
              {item.transaction_type === 'CREDIT' ? `₹${item.amount}` : '-'}
            </Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>DEBIT</Text>
            <Text style={[styles.amountValue, { color: '#ef4444' }]}>
              {item.transaction_type === 'DEBIT' ? `₹${item.amount}` : '-'}
            </Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>BALANCE</Text>
            <Text style={[styles.amountValue, { color: '#0f172a' }]}>₹{balance}</Text>
          </View>
        </View>
      </View>
    );
  };

  const filteredHeads = heads.filter(h => h.transaction_type === currentEntry.transaction_type);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash Book</Text>
        <View style={{ width: 24 }} />
      </View>

      {user?.role === 'superadmin' && (
        <View style={{ paddingHorizontal: 15, paddingTop: 15, backgroundColor: '#ffffff' }}>
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
        </View>
      )}

      <View style={styles.filterSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={16} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search entries..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
        <View style={[styles.searchRow, { marginTop: 10 }]}>
          <TouchableOpacity style={[styles.dateInput, { flex: 1, marginRight: 5, justifyContent: 'space-between' }]} onPress={() => setShowFromPicker(true)}>
            <Text style={{ color: '#0f172a', fontWeight: '600' }}>{fromDate}</Text>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
          </TouchableOpacity>
          {showFromPicker && (
            <DateTimePicker
              value={new Date(fromDate)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowFromPicker(false);
                if (selectedDate) setFromDate(selectedDate.toISOString().split('T')[0]);
              }}
            />
          )}

          <TouchableOpacity style={[styles.dateInput, { flex: 1, marginLeft: 5, justifyContent: 'space-between' }]} onPress={() => setShowToPicker(true)}>
            <Text style={{ color: '#0f172a', fontWeight: '600' }}>{toDate}</Text>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
          </TouchableOpacity>
          {showToPicker && (
            <DateTimePicker
              value={new Date(toDate)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowToPicker(false);
                if (selectedDate) setToDate(selectedDate.toISOString().split('T')[0]);
              }}
            />
          )}
        </View>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={entries}
            keyExtractor={item => item.id.toString()}
            renderItem={renderEntry}
            contentContainerStyle={{ paddingBottom: 20, width: '100%', maxWidth: 800, alignSelf: 'center' }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No cash book entries found.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Add Entry</Text>
      </TouchableOpacity>

      {/* Entry Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Entry' : 'Add Entry'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              
              <Text style={styles.label}>Transaction Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, currentEntry.transaction_type === 'CREDIT' && styles.typeBtnActiveC]}
                  onPress={() => setCurrentEntry({...currentEntry, transaction_type: 'CREDIT', account_head_id: ''})}
                >
                  <Text style={[styles.typeBtnText, currentEntry.transaction_type === 'CREDIT' && { color: '#fff' }]}>Credit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, currentEntry.transaction_type === 'DEBIT' && styles.typeBtnActiveD]}
                  onPress={() => setCurrentEntry({...currentEntry, transaction_type: 'DEBIT', account_head_id: ''})}
                >
                  <Text style={[styles.typeBtnText, currentEntry.transaction_type === 'DEBIT' && { color: '#fff' }]}>Debit</Text>
                </TouchableOpacity>
              </View>

              {user?.role === 'superadmin' && (
                <>
                  <Text style={styles.label}>Branch</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={currentEntry.branch_id}
                      onValueChange={(val) => setCurrentEntry({...currentEntry, branch_id: val})}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Branch" value="" />
                      {branches.map(b => (
                        <Picker.Item key={b.id} label={b.branch_name} value={b.id.toString()} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              <Text style={styles.label}>Account Head</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={currentEntry.account_head_id}
                  onValueChange={(val) => setCurrentEntry({...currentEntry, account_head_id: val})}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Account Head" value="" />
                  {filteredHeads.map(h => (
                    <Picker.Item key={h.id} label={h.name} value={h.id} />
                  ))}
                </Picker>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Amount (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={currentEntry.amount.toString()}
                    onChangeText={(val) => setCurrentEntry({...currentEntry, amount: val})}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Date</Text>
                  <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowTransactionDatePicker(true)}>
                    <Text>{currentEntry.transaction_date}</Text>
                  </TouchableOpacity>
                  {showTransactionDatePicker && (
                    <DateTimePicker
                      value={new Date(currentEntry.transaction_date || today)}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowTransactionDatePicker(false);
                        if (selectedDate) setCurrentEntry({...currentEntry, transaction_date: selectedDate.toISOString().split('T')[0]});
                      }}
                    />
                  )}
                </View>
              </View>

              <Text style={styles.label}>Mode of Pay</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={currentEntry.mode_of_pay}
                  onValueChange={(val) => setCurrentEntry({...currentEntry, mode_of_pay: val})}
                  style={styles.picker}
                >
                  <Picker.Item label="Cash" value="Cash" />
                  <Picker.Item label="Cheque" value="Cheque" />
                  <Picker.Item label="DD" value="DD" />
                  <Picker.Item label="Online" value="Online" />
                </Picker>
              </View>

              {currentEntry.mode_of_pay !== 'Cash' && (
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Ref Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Cheque/DD/Txn No"
                      value={currentEntry.dd_cheque_no}
                      onChangeText={(val) => setCurrentEntry({...currentEntry, dd_cheque_no: val})}
                    />
                  </View>
                  {(currentEntry.mode_of_pay === 'Cheque' || currentEntry.mode_of_pay === 'DD') && (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Ref Date</Text>
                      <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowRefDatePicker(true)}>
                        <Text>{currentEntry.dd_cheque_date}</Text>
                      </TouchableOpacity>
                      {showRefDatePicker && (
                        <DateTimePicker
                          value={new Date(currentEntry.dd_cheque_date || today)}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowRefDatePicker(false);
                            if (selectedDate) setCurrentEntry({...currentEntry, dd_cheque_date: selectedDate.toISOString().split('T')[0]});
                          }}
                        />
                      )}
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.label}>Paid/Received By</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={currentEntry.paid_by_received_by}
                onChangeText={(val) => setCurrentEntry({...currentEntry, paid_by_received_by: val})}
              />

              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Remarks/Description"
                multiline
                value={currentEntry.remarks}
                onChangeText={(val) => setCurrentEntry({...currentEntry, remarks: val})}
              />

            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Entry</Text>}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  backBtn: { padding: 4 },
  addBtn: { padding: 4 },
  
  filterSection: { padding: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10 },
  searchIcon: { marginRight: 5 },
  searchInput: { flex: 1, height: 40, fontSize: 13, color: '#0f172a' },
  dateInput: { width: 110, height: 40, backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, fontSize: 13, textAlign: 'center', color: '#0f172a' },
  
  listContainer: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
  card: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  voucherNo: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  actionRow: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 6 },
  
  accountHead: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 5 },
  remarks: { fontSize: 12, color: '#64748b', marginBottom: 15 },
  
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  amountBox: { alignItems: 'center' },
  amountLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', marginBottom: 2 },
  amountValue: { fontSize: 14, fontWeight: '900' },
  
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 10 },

  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  fabText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  
  formScroll: { padding: 20 },
  row: { flexDirection: 'row' },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, height: 42, fontSize: 14, color: '#0f172a', fontWeight: '600' },
  
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  typeBtnActiveC: { backgroundColor: '#10b981', borderColor: '#10b981' },
  typeBtnActiveD: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  typeBtnText: { fontSize: 13, fontWeight: '800', color: '#64748b' },

  pickerContainer: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden', height: 42, justifyContent: 'center' },
  picker: { height: 42 },

  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', marginRight: 10, borderRadius: 8, backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  saveBtn: { flex: 2, paddingVertical: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#3b82f6' },
  saveBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
});
