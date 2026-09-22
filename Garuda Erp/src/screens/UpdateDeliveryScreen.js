import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, SafeAreaView, Switch, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';

const DELIVERABLE_STATUSES = ['BOOKED', 'PENDING', 'DISPATCHED', 'RECEIVED', 'INWARDED', 'LOCAL_TRIP', 'Arrived at Destination', 'Out for Delivery'];

const NOT_DELIVERED_REASONS = [
  'Party Refused to Accept', 'Party Not Available / Absent',
  'Incorrect / Incomplete Address', 'Payment Not Ready (To Pay)',
  'Damaged / Rejected by Consignee', 'Natural Calamity / Road Block', 'Other'
];

const RTO_REASONS = [
  'Address Not Found', 'Consignee Relocated', 'Consignee Refused Delivery',
  'Duplicate Shipment', 'Damaged in Transit', 'Incorrect Consignee Details',
  'Consignee Requested Return', 'Other'
];

export default function UpdateDeliveryScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [gcNumber, setGcNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deliveryData, setDeliveryData] = useState(null);
  
  const [status, setStatus] = useState('Delivered');
  const [remarks, setRemarks] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState(false);
  
  const [notDeliveredReason, setNotDeliveredReason] = useState('');
  const [notDeliveredReasonOther, setNotDeliveredReasonOther] = useState('');
  const [rtoReason, setRtoReason] = useState('');
  const [rtoReasonOther, setRtoReasonOther] = useState('');
  const [redirectBranch, setRedirectBranch] = useState('');
  const [redirectReason, setRedirectReason] = useState('');
  const [redirectReasonOther, setRedirectReasonOther] = useState('');
  
  const [filterBranchId, setFilterBranchId] = useState('');
  const [branches, setBranches] = useState([]);
  const [user, setUser] = useState(null);
  const [isEligible, setIsEligible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data);
      }
    } catch (error) {
      console.error('Error loading initial data', error);
    }
  };

  const handleSearch = async (searchGcNumber = gcNumber) => {
    const numToSearch = (typeof searchGcNumber === 'string' ? searchGcNumber : gcNumber).trim().toUpperCase();
    if (!numToSearch) {
      Alert.alert('Error', getErrorMessage(error, 'Please enter a GC Number'));
      return;
    }
    
    if (user?.role === 'superadmin' && !filterBranchId) {
      Alert.alert('Error', 'Super Admin: Please select an Acting Branch first.');
      return;
    }
    
    setLoading(true);
    setDeliveryData(null);
    setErrorMsg('');
    setIsEligible(false);

    try {
      const response = await api.get(`/waybills/search/${numToSearch}`);
      
      if (response.data.success) {
        const gc = response.data.data;
        setDeliveryData(gc);
        setStatus('Delivered');
        setRemarks(gc.remarks || '');
        setReceiverName(gc.receiver_name || '');
        setDiscount(gc.discount?.toString() || '');
        
        // Reset sub-reasons
        setNotDeliveredReason(''); setNotDeliveredReasonOther('');
        setRtoReason(''); setRtoReasonOther('');
        setRedirectBranch(''); setRedirectReason(''); setRedirectReasonOther('');

        const currentStatus = (gc.status || '').toUpperCase();
        const isDelivered = currentStatus === 'DELIVERED';

        if (isDelivered) {
          setErrorMsg(`GC ${numToSearch} has already been DELIVERED.`);
          setIsEligible(false);
        } else {
          const activeBranchId = user?.role === 'superadmin' ? parseInt(filterBranchId) : user?.branch_id;
          let branchError = false;

          if (activeBranchId) {
            const bookedHere = gc.origin_branch_id === activeBranchId;
            const inwardedHere = gc.inward_branch_id === activeBranchId;

            if (!bookedHere && !inwardedHere) {
              const activeBranchName = user?.role === 'superadmin' 
                ? branches.find(b => b.id.toString() === filterBranchId.toString())?.branch_name 
                : user?.branch_name;
              setErrorMsg(`Branch Mismatch - ${numToSearch} was not booked or inwarded at ${activeBranchName || 'your branch'}.`);
              setIsEligible(false);
              branchError = true;
            }
          }

          if (!branchError) {
            const bookedHere = activeBranchId && gc.origin_branch_id === activeBranchId;
            let eligible = DELIVERABLE_STATUSES.some(s => s.toUpperCase() === currentStatus);
            if (currentStatus === 'BOOKED' && !bookedHere) {
              eligible = false;
            }
            
            setIsEligible(eligible);
            if (!eligible) {
              setErrorMsg(`GC status is "${gc.status}". Delivery update not allowed from current branch/status.`);
            }
          }
        }
      } else {
        Alert.alert('Error', response.data.message || 'GC not found');
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Connection failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ type, data }) => {
    setIsScannerOpen(false);
    if (data) {
      const scannedGc = data.trim().toUpperCase();
      setGcNumber(scannedGc);
      setTimeout(() => {
        handleSearch(scannedGc);
      }, 300);
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera access is required to scan barcodes.');
        return;
      }
    }
    setIsScannerOpen(true);
  };

  const handleUpdate = async () => {
    const isNotDelivered = status === 'Not Delivered';
    const isRTO = status === 'RTO (Return to Origin)';
    const isRedirected = status === 'Redirected';

    if (isNotDelivered && !notDeliveredReason) return Alert.alert('Error', 'Please select a reason for non-delivery');
    if (isNotDelivered && notDeliveredReason === 'Other' && !notDeliveredReasonOther.trim()) return Alert.alert('Error', 'Please specify the reason');
    if (isRTO && !rtoReason) return Alert.alert('Error', 'Please select a reason for RTO');
    if (isRTO && rtoReason === 'Other' && !rtoReasonOther.trim()) return Alert.alert('Error', 'Please specify the RTO reason');
    if (isRedirected && !redirectBranch) return Alert.alert('Error', 'Please select a target branch for redirection');
    if (isRedirected && !redirectReason) return Alert.alert('Error', 'Please select a reason for redirecting');
    if (isRedirected && redirectReason === 'Other' && !redirectReasonOther.trim()) return Alert.alert('Error', 'Please specify the redirect reason');

    setUpdating(true);

    const finalRemarks = isNotDelivered
      ? (notDeliveredReason === 'Other' ? notDeliveredReasonOther : notDeliveredReason)
      : isRTO
        ? (rtoReason === 'Other' ? rtoReasonOther : rtoReason)
        : isRedirected
          ? (redirectReason === 'Other' ? redirectReasonOther : redirectReason)
          : remarks;

    const formData = new FormData();
    formData.append('gc_number', deliveryData.gc_number);
    formData.append('status', status);
    formData.append('remarks', finalRemarks);
    formData.append('receiver_name', status === 'Delivered' ? receiverName : '');
    formData.append('discount', status === 'Delivered' ? (parseFloat(discount) || 0) : 0);
    
    if (isRedirected) formData.append('redirect_branch_id', redirectBranch);
    
    const finalBranchId = user?.role === 'superadmin' ? filterBranchId : user?.branch_id || '';
    const finalBranchName = user?.role === 'superadmin' ? branches.find(b => b.id.toString() === filterBranchId.toString())?.branch_name : user?.branch_name || '';
    
    formData.append('delivered_branch_id', finalBranchId);
    formData.append('delivered_branch_name', finalBranchName);
    
    if (status === 'Delivered' && deliveryData?.account_type === 'topay') {
      formData.append('payment_method', paymentMethod);
      formData.append('cash_received', cashReceived ? 'true' : 'false');
    }

    try {
      const response = await api.post('/waybills/update-delivery-status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Delivery status updated successfully!', [
          { text: 'OK', onPress: () => {
              setDeliveryData(response.data.data);
              setIsEligible(false);
              setErrorMsg('Update Successful.');
          }}
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update delivery status');
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Connection failed. Please check your internet connection.'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Delivery</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Superadmin Branch Filter */}
        {user?.role === 'superadmin' && (
          <View style={styles.searchCard}>
            <Text style={styles.label}>Select Acting Branch (Required)</Text>
            <View style={[styles.pickerContainer, { marginBottom: 0 }]}>
              <Picker selectedValue={filterBranchId} onValueChange={setFilterBranchId} style={styles.picker}>
                <Picker.Item label="-- Select Branch --" value="" />
                {branches.map(b => <Picker.Item key={b.id} label={b.branch_name} value={b.id.toString()} />)}
              </Picker>
            </View>
          </View>
        )}

        {/* Search Section */}
        <View style={styles.searchCard}>
          <Text style={styles.label}>Enter GC Number</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={gcNumber}
              onChangeText={setGcNumber}
              placeholder="e.g. GC-12345"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
              <Ionicons name="barcode-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="search" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="information-circle" size={20} color="#b45309" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {deliveryData && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.gcTitle}>{deliveryData.gc_number}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{deliveryData.status}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#64748b" />
              <Text style={styles.detailText}>Booked: {deliveryData.bill_date}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
              <Text style={styles.detailText}>
                {deliveryData.origin_branch?.branch_name} ➔ {deliveryData.destination?.city_name}
              </Text>
            </View>

            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Consignor</Text>
              <Text style={styles.partyName}>{deliveryData.consignor?.name}</Text>
              <Text style={styles.partyLabel}>Consignee</Text>
              <Text style={styles.partyName}>{deliveryData.consignee?.name}</Text>
            </View>

            {isEligible && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Update Status</Text>
                
                <Text style={styles.inputLabel}>New Status</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={status} onValueChange={setStatus} style={styles.picker}>
                    <Picker.Item label="Delivered" value="Delivered" />
                    <Picker.Item label="RTO (Return to Origin)" value="RTO (Return to Origin)" />
                    <Picker.Item label="Redirected" value="Redirected" />
                    <Picker.Item label="Not Delivered" value="Not Delivered" />
                  </Picker>
                </View>

                {status === 'Not Delivered' && (
                  <>
                    <Text style={styles.inputLabel}>Reason</Text>
                    <View style={styles.pickerContainer}>
                      <Picker selectedValue={notDeliveredReason} onValueChange={setNotDeliveredReason} style={styles.picker}>
                        <Picker.Item label="-- Select Reason --" value="" />
                        {NOT_DELIVERED_REASONS.map(r => <Picker.Item key={r} label={r} value={r} />)}
                      </Picker>
                    </View>
                    {notDeliveredReason === 'Other' && (
                      <TextInput style={styles.input} placeholder="Specify Reason" value={notDeliveredReasonOther} onChangeText={setNotDeliveredReasonOther} />
                    )}
                  </>
                )}

                {status === 'RTO (Return to Origin)' && (
                  <>
                    <Text style={styles.inputLabel}>RTO Reason</Text>
                    <View style={styles.pickerContainer}>
                      <Picker selectedValue={rtoReason} onValueChange={setRtoReason} style={styles.picker}>
                        <Picker.Item label="-- Select Reason --" value="" />
                        {RTO_REASONS.map(r => <Picker.Item key={r} label={r} value={r} />)}
                      </Picker>
                    </View>
                    {rtoReason === 'Other' && (
                      <TextInput style={styles.input} placeholder="Specify RTO Reason" value={rtoReasonOther} onChangeText={setRtoReasonOther} />
                    )}
                  </>
                )}

                {status === 'Redirected' && (
                  <>
                    <Text style={styles.inputLabel}>Redirect To Branch</Text>
                    <View style={styles.pickerContainer}>
                      <Picker selectedValue={redirectBranch} onValueChange={setRedirectBranch} style={styles.picker}>
                        <Picker.Item label="-- Select Target Branch --" value="" />
                        {branches.map(b => <Picker.Item key={b.id} label={b.branch_name} value={b.id.toString()} />)}
                      </Picker>
                    </View>
                    <Text style={styles.inputLabel}>Reason</Text>
                    <View style={styles.pickerContainer}>
                      <Picker selectedValue={redirectReason} onValueChange={setRedirectReason} style={styles.picker}>
                        <Picker.Item label="-- Select Reason --" value="" />
                        {['Customer Relocated', 'Wrongly Routed', 'Address Not Serviceable', 'Other'].map(r => <Picker.Item key={r} label={r} value={r} />)}
                      </Picker>
                    </View>
                    {redirectReason === 'Other' && (
                      <TextInput style={styles.input} placeholder="Specify Redirect Reason" value={redirectReasonOther} onChangeText={setRedirectReasonOther} />
                    )}
                  </>
                )}

                {status === 'Delivered' && (
                  <>
                    <Text style={styles.inputLabel}>Receiver Name</Text>
                    <TextInput style={styles.input} placeholder="Name of person receiving" value={receiverName} onChangeText={setReceiverName} />
                    
                    {deliveryData?.account_type === 'topay' && (
                      <>
                        <Text style={styles.inputLabel}>Discount (Rs.)</Text>
                        <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={discount} onChangeText={setDiscount} />
                        
                        <Text style={styles.inputLabel}>Payment Mode</Text>
                        <View style={styles.pickerContainer}>
                          <Picker selectedValue={paymentMethod} onValueChange={setPaymentMethod} style={styles.picker}>
                            <Picker.Item label="Cash" value="cash" />
                            <Picker.Item label="UPI" value="upi" />
                            <Picker.Item label="Bank Transfer" value="bank_transfer" />
                          </Picker>
                        </View>
                        
                        <View style={styles.switchRow}>
                          <Text style={styles.switchLabel}>Payment Received (Rs. {Math.max(0, deliveryData.grand_total - (parseFloat(discount) || 0))})</Text>
                          <Switch value={cashReceived} onValueChange={setCashReceived} trackColor={{ false: "#cbd5e1", true: "#86efac" }} thumbColor={cashReceived ? "#16a34a" : "#f1f5f9"} />
                        </View>
                      </>
                    )}
                  </>
                )}

                {status !== 'Not Delivered' && status !== 'RTO (Return to Origin)' && status !== 'Redirected' && (
                  <>
                    <Text style={styles.inputLabel}>Remarks</Text>
                    <TextInput style={styles.input} placeholder="Optional remarks" value={remarks} onChangeText={setRemarks} />
                  </>
                )}

                <TouchableOpacity 
                  style={[styles.submitBtn, updating && styles.submitBtnDisabled]} 
                  onPress={handleUpdate} 
                  disabled={updating}
                >
                  {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Update Delivery</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Scanner Modal */}
      <Modal visible={isScannerOpen} animationType="slide" onRequestClose={() => setIsScannerOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_e", "upc_a"],
              }}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerTarget} />
            </View>
            <TouchableOpacity 
              style={styles.closeScannerBtn}
              onPress={() => setIsScannerOpen(false)}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  container: { 
    padding: 16, 
    paddingBottom: 40,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center'
  },
  searchCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, height: 44, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    paddingHorizontal: 12, fontSize: 15, backgroundColor: '#f8fafc'
  },
  scanBtn: {
    width: 44, height: 44, backgroundColor: '#475569', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center'
  },
  searchBtn: {
    width: 44, height: 44, backgroundColor: '#2563eb', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center'
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7',
    padding: 12, borderRadius: 8, marginBottom: 16, gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: '#b45309', fontWeight: '500' },
  detailsCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gcTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statusBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  detailText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  partyBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  partyLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: 8 },
  partyName: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  formContainer: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  formTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 16, textTransform: 'uppercase' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: {
    height: 44, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    paddingHorizontal: 12, fontSize: 15, backgroundColor: '#f8fafc'
  },
  pickerContainer: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: '#f8fafc',
    overflow: 'hidden', height: 44, justifyContent: 'center'
  },
  picker: { height: 44, width: '100%' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#334155', flex: 1 },
  submitBtn: {
    backgroundColor: '#16a34a', borderRadius: 8, height: 48,
    alignItems: 'center', justifyContent: 'center', marginTop: 24
  },
  submitBtnDisabled: { backgroundColor: '#94a3b8' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  scannerTarget: {
    width: 250, height: 150,
    borderWidth: 2, borderColor: '#10b981',
    backgroundColor: 'transparent'
  },
  closeScannerBtn: {
    position: 'absolute', top: 40, right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24, padding: 8
  }
});
