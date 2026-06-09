import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  Alert, SafeAreaView, ActivityIndicator, TextInput, ScrollView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';

export default function TripSheetEntryScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [waybills, setWaybills] = useState([]);
  const [branches, setBranches] = useState([]);
  
  const [selectedWaybills, setSelectedWaybills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    advance_amount: '',
    modeOfPay: '',
    remarks: '',
    opening_km: '',
    alert_branch: '',
    dispatch_branch_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const fetchWaybills = async (branchId) => {
    if (!branchId) {
      setWaybills([]);
      return;
    }
    try {
      const wbRes = await api.get(`/waybills?status=PENDING,RECEIVED,Booked,INWARDED&available_at_branch=${branchId}`);
      if (wbRes.data.success) {
        setWaybills(wbRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching waybills:', error);
    }
  };

  useEffect(() => {
    if (formData.dispatch_branch_id) {
      fetchWaybills(formData.dispatch_branch_id);
      setSelectedWaybills([]); // Clear selections when branch changes
    }
  }, [formData.dispatch_branch_id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('user');
      let currentUser = null;
      if (userData) {
        currentUser = JSON.parse(userData);
        setUser(currentUser);
        setFormData(prev => ({...prev, dispatch_branch_id: currentUser.branch_id || ''}));
      }

      const [vRes, dRes, bRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/branches')
      ]);

      if (vRes.data.success) setVehicles(vRes.data.data);
      if (dRes.data.success) setDrivers(dRes.data.data);
      if (bRes.data.success) setBranches(bRes.data.data);

    } catch (error) {
      console.error('Failed to load initial data', error);
      Alert.alert('Error', 'Failed to load master data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    if (selectedWaybills.includes(id)) {
      setSelectedWaybills(prev => prev.filter(wbId => wbId !== id));
    } else {
      setSelectedWaybills(prev => [...prev, id]);
    }
  };

  const handleBarcodeScanned = ({ type, data }) => {
    setIsScannerOpen(false);
    if (data) {
      const scannedGC = data.trim().toUpperCase();
      setSearchQuery(scannedGC);
      
      const foundWb = waybills.find(wb => wb.gc_number.toUpperCase() === scannedGC);
      if (foundWb) {
        if (!selectedWaybills.includes(foundWb.id)) {
          setSelectedWaybills(prev => [...prev, foundWb.id]);
          Alert.alert('Success', `GC ${scannedGC} added to the trip.`);
        } else {
          Alert.alert('Info', `GC ${scannedGC} is already selected.`);
        }
      } else {
        Alert.alert('Not Found', `GC ${scannedGC} is not in the pending list for this branch.`);
      }
    }
  };

  const renderScannerModal = () => (
    <Modal visible={isScannerOpen} animationType="slide" transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity onPress={() => setIsScannerOpen(false)} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.scannerTitle}>Scan GC Barcode</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={{ flex: 1 }}>
          <CameraView 
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_e", "upc_a"],
            }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerHint}>Position the barcode within the frame</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const filteredWaybills = waybills.filter(wb => {
    if (selectedWaybills.includes(wb.id)) return true; // Always show selected GCs
    if (searchQuery.length < 2) return false; // Hide unselected GCs until user searches
    return wb.gc_number.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const submitTripSheet = async () => {
    if (!formData.vehicle_id || !formData.driver_id) {
      Alert.alert('Validation', 'Please select a Vehicle and a Driver.');
      return;
    }
    if (selectedWaybills.length === 0) {
      Alert.alert('Validation', 'Please select at least one GC to attach to the trip.');
      return;
    }
    if (!user?.branch_id) {
      Alert.alert('Error', 'Your branch ID is missing.');
      return;
    }

    setSubmitting(true);
    try {
      // Find selected vehicle to extract owner_name
      const selectedVehicle = vehicles.find(v => String(v.id) === String(formData.vehicle_id));

      const payload = {
        vehicle_id: formData.vehicle_id,
        driver_id: formData.driver_id,
        trip_date: new Date().toISOString().split('T')[0],
        mode_of_pay: formData.modeOfPay,
        trip_remarks: formData.remarks,
        advance_amount: formData.advance_amount,
        gc_ids: selectedWaybills,
        dispatch_branch_id: formData.dispatch_branch_id || user.branch_id,
        trip_type: 'INTERSTATE',
        owner_name: selectedVehicle?.owner_name || '',
        rate_per_km: selectedVehicle?.rate_per_km || '',
        opening_km: formData.opening_km,
        alert_branch: formData.alert_branch || null,
      };

      const response = await api.post('/trip-sheets', payload);
      
      if (response.data.success) {
        Alert.alert(
          'Success', 
          `Trip Sheet ${response.data.data.trip_number} generated successfully!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to generate Trip Sheet.');
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
          <Text style={styles.headerTitle}>New Trip Sheet</Text>
          <Text style={styles.headerSubtitle}>Dispatch & Assign</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Trip Details</Text>
            
            {user?.role === 'superadmin' && (
              <>
                <Text style={styles.label}>Dispatch Branch <Text style={{color: 'red'}}>*</Text></Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.dispatch_branch_id}
                    onValueChange={(val) => setFormData({...formData, dispatch_branch_id: val})}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Dispatch Branch" value="" />
                    {branches.map((b) => (
                      <Picker.Item key={b.id} label={b.branch_name} value={b.id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <Text style={styles.label}>Select Vehicle <Text style={{color: 'red'}}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.vehicle_id}
                onValueChange={(val) => setFormData({...formData, vehicle_id: val})}
                style={styles.picker}
              >
                <Picker.Item label="Select Vehicle" value="" />
                {vehicles.map((v) => (
                  <Picker.Item key={v.id} label={v.vehicle_number} value={v.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Select Driver <Text style={{color: 'red'}}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.driver_id}
                onValueChange={(val) => setFormData({...formData, driver_id: val})}
                style={styles.picker}
              >
                <Picker.Item label="Select Driver" value="" />
                {drivers.map((d) => (
                  <Picker.Item key={d.id} label={d.name} value={d.id} />
                ))}
              </Picker>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Opening KM</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. 12500"
                  keyboardType="numeric"
                  value={formData.opening_km}
                  onChangeText={(val) => setFormData({...formData, opening_km: val})}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Alert Branch</Text>
                <View style={[styles.pickerContainer, { height: 48 }]}>
                  <Picker
                    selectedValue={formData.alert_branch}
                    onValueChange={(val) => setFormData({...formData, alert_branch: val})}
                    style={[styles.picker, { height: 48 }]}
                  >
                    <Picker.Item label="Select Branch" value="" />
                    {branches.map((b) => (
                      <Picker.Item key={b.id} label={b.branch_name} value={b.id} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Advance (₹)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.advance_amount}
                  onChangeText={(val) => setFormData({...formData, advance_amount: val})}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Mode of Pay</Text>
                <View style={[styles.pickerContainer, { height: 48 }]}>
                  <Picker
                    selectedValue={formData.modeOfPay}
                    onValueChange={(val) => setFormData({...formData, modeOfPay: val})}
                    style={[styles.picker, { height: 48 }]}
                  >
                    <Picker.Item label="Select" value="" />
                    <Picker.Item label="CASH" value="CASH" />
                    <Picker.Item label="TRANSFER" value="TRANSFER" />
                  </Picker>
                </View>
              </View>
            </View>

            <Text style={styles.label}>Remarks</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Any additional notes..."
              multiline
              value={formData.remarks}
              onChangeText={(val) => setFormData({...formData, remarks: val})}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, (selectedWaybills.length === 0 || submitting) && styles.submitBtnDisabled, { marginBottom: 15 }]}
            onPress={submitTripSheet}
            disabled={selectedWaybills.length === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Generate Trip Sheet</Text>
            )}
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>Assign GCs</Text>
              <Text style={styles.badgeText}>{selectedWaybills.length} Selected</Text>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search GC Number..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="characters"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={styles.scanBtn}
                onPress={async () => {
                  if (!permission?.granted) {
                    const res = await requestPermission();
                    if (!res.granted) {
                      Alert.alert("Permission required", "Camera permission is required to scan barcodes.");
                      return;
                    }
                  }
                  setIsScannerOpen(true);
                }}
              >
                <Ionicons name="barcode-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {filteredWaybills.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No pending GCs found matching your search.</Text>
              </View>
            ) : (
              filteredWaybills.map(item => {
                const isSelected = selectedWaybills.includes(item.id);
                return (
                  <TouchableOpacity 
                    key={item.id}
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
                        <Text style={styles.gcDest}>{item.destination?.city_name || '-'}</Text>
                      </View>
                      <Text style={styles.gcParty} numberOfLines={1}>
                        {item.consignor?.name || 'N/A'} ➔ {item.consignee?.name || 'N/A'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

        </ScrollView>
      )}

      {renderScannerModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  headerSubtitle: { fontSize: 10, fontWeight: '700', color: '#059669', textAlign: 'center', textTransform: 'uppercase', marginTop: 2 },
  backBtn: { padding: 4 },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { 
    padding: 20, 
    paddingBottom: 80,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center'
  },
  
  card: { backgroundColor: '#ffffff', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#1e293b', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  pickerContainer: { backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  picker: { height: 50 },

  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },

  listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeText: { color: '#059669', fontSize: 12, fontWeight: '800', backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  
  emptyState: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 12, color: '#94a3b8', marginTop: 8, textAlign: 'center' },

  gcCard: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  gcCardSelected: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  checkboxIcon: { marginRight: 10 },
  gcInfo: { flex: 1 },
  gcRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  gcNumber: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  gcDest: { fontSize: 10, fontWeight: '800', color: '#059669', textTransform: 'uppercase' },
  gcParty: { fontSize: 11, color: '#475569', fontWeight: '600' },

  submitBtn: { backgroundColor: '#059669', paddingVertical: 18, borderRadius: 12, alignItems: 'center', elevation: 2, marginTop: 10 },
  submitBtnDisabled: { backgroundColor: '#a7f3d0', elevation: 0 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },

  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, height: 48, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  scanBtn: { width: 48, height: 48, backgroundColor: '#2563eb', borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  scannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  closeBtn: { padding: 5 },
  scannerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  scannerFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#10b981', backgroundColor: 'transparent' },
  scannerHint: { color: '#ffffff', marginTop: 20, fontSize: 14, fontWeight: 'bold' }
});
