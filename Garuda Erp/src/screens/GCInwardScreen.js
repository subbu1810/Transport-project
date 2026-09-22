import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
  Alert, SafeAreaView, ActivityIndicator, Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';

export default function GCInwardScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  
  const [scannedGCs, setScannedGCs] = useState([]);
  const [loadingGC, setLoadingGC] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      let currentUser = null;
      if (userData) {
        currentUser = JSON.parse(userData);
        setUser(currentUser);
        setSelectedBranchId(currentUser.branch_id || '');
      }

      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load user or branches', error);
    }
  };

  const handleBarcodeScanned = ({ type, data }) => {
    setIsScannerOpen(false);
    if (data) {
      processGCNumber(data.trim());
    }
  };

  const processGCNumber = async (gcNumber) => {
    if (!gcNumber) return;
    
    const uppercaseGC = gcNumber.toUpperCase();

    // Check if already scanned
    if (scannedGCs.some(gc => gc.gc_number === uppercaseGC)) {
      Alert.alert('Duplicate', `GC ${uppercaseGC} is already in the scanned list.`);
      return;
    }

    setLoadingGC(true);
    try {
      const response = await api.get(`/waybills/search/${uppercaseGC}`);
      if (response.data.success && response.data.data) {
        const wb = response.data.data;
        
        // Validation: Ensure it's not already inwarded or delivered
        const currentStatus = wb.status?.toUpperCase();
        if (currentStatus === 'INWARDED' || currentStatus === 'DELIVERED' || currentStatus === 'RECEIVED') {
          Alert.alert('Invalid Status', `GC ${uppercaseGC} is already ${currentStatus}.`);
          return;
        }

        setScannedGCs(prev => [...prev, {
          id: wb.id,
          gc_number: wb.gc_number,
          status: wb.status,
          origin: wb.origin_branch?.branch_name || 'Origin',
          destination: wb.destination?.branch_name || wb.destination?.city_name || 'Dest'
        }]);
        setManualInput('');
      } else {
        Alert.alert('Not Found', `GC ${uppercaseGC} not found.`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', getErrorMessage(error, `Failed to verify GC ${uppercaseGC}.`));
    } finally {
      setLoadingGC(false);
    }
  };

  const removeGC = (gcNumber) => {
    setScannedGCs(prev => prev.filter(gc => gc.gc_number !== gcNumber));
  };

  const submitInward = async () => {
    if (scannedGCs.length === 0) {
      Alert.alert('Validation Error', 'Please scan at least one GC to inward.');
      return;
    }

    const branchToUse = selectedBranchId || user?.branch_id;

    if (!branchToUse) {
      Alert.alert('Error', 'Your branch ID is missing. Cannot perform inward.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        waybill_ids: scannedGCs.map(gc => gc.id),
        received_branch_id: branchToUse,
        received_date: new Date().toISOString().split('T')[0],
        remarks: "Inwarded via Mobile App Scanner",
        inward_by: user.id
      };

      const response = await api.post('/waybills/bulk-inward', payload);
      
      if (response.data.success) {
        Alert.alert('Success', `Successfully inwarded ${scannedGCs.length} GCs!`, [
          { text: 'OK', onPress: () => {
            setScannedGCs([]);
            navigation.goBack();
          }}
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to bulk inward.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', getErrorMessage(error, 'An error occurred while submitting. Please try again.'));
    } finally {
      setSubmitting(false);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GC Inward</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        
        {user?.role === 'superadmin' && (
          <View style={styles.branchSelectContainer}>
            <Text style={styles.branchSelectLabel}>Inward To Branch <Text style={{color: 'red'}}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBranchId}
                onValueChange={(val) => setSelectedBranchId(val)}
                style={styles.picker}
              >
                <Picker.Item label="Select Inward Branch" value="" />
                {branches.map((b) => (
                  <Picker.Item key={b.id} label={b.branch_name} value={b.id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Input & Scan Row */}
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Enter GC Number manually"
              value={manualInput}
              onChangeText={setManualInput}
              autoCapitalize="characters"
              onSubmitEditing={() => processGCNumber(manualInput)}
            />
            {loadingGC && <ActivityIndicator size="small" color="#2563eb" />}
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

        <TouchableOpacity 
          style={styles.addManualBtn} 
          onPress={() => processGCNumber(manualInput)}
          disabled={!manualInput.trim() || loadingGC}
        >
          <Text style={styles.addManualBtnText}>Add GC</Text>
        </TouchableOpacity>

        {/* Scanned List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Scanned GCs</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{scannedGCs.length}</Text>
            </View>
          </View>

          {scannedGCs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="scan-circle-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No GCs scanned yet.</Text>
              <Text style={styles.emptySubText}>Use the scanner or enter manually to build your inward list.</Text>
            </View>
          ) : (
            <FlatList 
              data={scannedGCs}
              keyExtractor={(item) => item.gc_number}
              contentContainerStyle={{ padding: 20, paddingBottom: 40, width: '100%', maxWidth: 800, alignSelf: 'center' }}
              renderItem={({ item }) => (
                <View style={styles.gcCard}>
                  <View style={styles.gcCardHeader}>
                    <Text style={styles.gcNumber}>{item.gc_number}</Text>
                    <TouchableOpacity onPress={() => removeGC(item.gc_number)} style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.gcRoute}>
                    <Ionicons name="location-outline" size={14} color="#64748b" />
                    <Text style={styles.gcRouteText}>{item.origin} ➔ {item.destination}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Submit Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitBtn, (scannedGCs.length === 0 || submitting) && styles.submitBtnDisabled]}
            onPress={submitInward}
            disabled={scannedGCs.length === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit {scannedGCs.length} GCs for Inward</Text>
            )}
          </TouchableOpacity>
        </View>

      </View>

      {renderScannerModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  backBtn: { padding: 4 },
  
  content: { flex: 1, padding: 15 },
  
  branchSelectContainer: { marginBottom: 15, backgroundColor: '#ffffff', padding: 15, borderRadius: 16, elevation: 2 },
  branchSelectLabel: { fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 8, textTransform: 'uppercase' },
  pickerContainer: { backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  picker: { height: 50 },

  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 15, height: 55, marginRight: 10, elevation: 2 },
  input: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  scanBtn: { width: 55, height: 55, backgroundColor: '#2563eb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  
  addManualBtn: { backgroundColor: '#e2e8f0', height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  addManualBtnText: { color: '#334155', fontWeight: 'bold', fontSize: 15 },

  listContainer: { flex: 1 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  badge: { backgroundColor: '#2563eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  badgeText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#64748b', marginTop: 15 },
  emptySubText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },

  gcCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  gcCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  gcNumber: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  removeBtn: { padding: 4 },
  gcRoute: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  gcRouteText: { fontSize: 13, color: '#64748b', marginLeft: 6, fontWeight: '600' },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#475569', letterSpacing: 0.5 },

  footer: { paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  submitBtn: { backgroundColor: '#10b981', paddingVertical: 18, borderRadius: 12, alignItems: 'center', elevation: 3 },
  submitBtnDisabled: { backgroundColor: '#a7f3d0', elevation: 0 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  scannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  closeBtn: { padding: 5 },
  scannerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  scannerFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#10b981', backgroundColor: 'transparent' },
  scannerHint: { color: '#ffffff', marginTop: 20, fontSize: 14, fontWeight: 'bold' }
});
