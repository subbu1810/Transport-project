import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, SafeAreaView, Modal, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

export default function UploadPODScreen({ navigation }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [gcNumber, setGcNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [gcData, setGcData] = useState(null);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSearch = async (searchGcNumber = gcNumber) => {
    const numToSearch = (typeof searchGcNumber === 'string' ? searchGcNumber : gcNumber).trim().toUpperCase();
    if (!numToSearch) {
      Alert.alert('Error', 'Please enter a GC Number');
      return;
    }
    
    setLoading(true);
    setGcData(null);
    setSelectedImage(null);

    try {
      const response = await api.get(`/waybills/search/${numToSearch}`);
      
      if (response.data.success) {
        setGcData(response.data.data);
      } else {
        Alert.alert('Error', response.data.message || 'GC not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed or GC not found.');
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
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera access is required to scan barcodes.');
        return;
      }
    }
    setIsScannerOpen(true);
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.4, // Compress image
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const captureImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Refused", "You've refused to allow this app to access your camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.4, // Compress image
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select or capture an image to upload.');
      return;
    }
    if (!gcData) {
      Alert.alert('Error', 'No GC data found.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    // In React Native, FormData expects an object with uri, type, and name for files
    const filename = selectedImage.uri.split('/').pop() || `pod_${gcData.gc_number}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('pod_file', {
      uri: selectedImage.uri,
      name: filename,
      type: type,
    });

    try {
      const response = await api.post(`/waybills/${gcData.id}/upload-pod`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        Alert.alert('Success', 'POD uploaded successfully!', [
          { text: 'OK', onPress: () => {
              setSelectedImage(null);
              // Option: Refresh GC data to show the new POD
              handleSearch(); 
          }}
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to upload POD');
      }
    } catch (error) {
      Alert.alert('Error', 'Upload failed. Please check your internet connection.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload POD</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
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

        {gcData && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.gcTitle}>{gcData.gc_number}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{gcData.status}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
              <Text style={styles.detailText}>
                {gcData.origin_branch?.branch_name} ➔ {gcData.destination?.city_name}
              </Text>
            </View>

            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Consignor</Text>
              <Text style={styles.partyName}>{gcData.consignor?.name}</Text>
              <Text style={styles.partyLabel}>Consignee</Text>
              <Text style={styles.partyName}>{gcData.consignee?.name}</Text>
            </View>

            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>Proof of Delivery (POD)</Text>
              
              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                    <Ionicons name="close-circle" size={28} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={captureImageFromCamera}>
                    <Ionicons name="camera" size={32} color="#2563eb" />
                    <Text style={styles.actionText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={pickImageFromGallery}>
                    <Ionicons name="image" size={32} color="#059669" />
                    <Text style={styles.actionText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedImage && (
                <TouchableOpacity 
                  style={[styles.submitBtn, uploading && styles.submitBtnDisabled]} 
                  onPress={handleUpload} 
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{marginRight: 8}} />
                      <Text style={styles.submitBtnText}>Upload POD</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
  
  uploadSection: {
    marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0'
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 16, textTransform: 'uppercase' },
  actionsRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12
  },
  actionBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, width: '45%',
    borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed'
  },
  actionText: {
    marginTop: 8, fontSize: 14, fontWeight: '600', color: '#475569'
  },
  imagePreviewContainer: {
    alignItems: 'center', marginVertical: 12, position: 'relative'
  },
  imagePreview: {
    width: '100%', height: 250, borderRadius: 12, resizeMode: 'cover'
  },
  removeImageBtn: {
    position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 14
  },
  submitBtn: {
    backgroundColor: '#16a34a', borderRadius: 8, height: 48,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
    flexDirection: 'row'
  },
  submitBtnDisabled: { backgroundColor: '#94a3b8' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)'
  },
  scannerTarget: {
    width: 250, height: 150, borderWidth: 2, borderColor: '#10b981', backgroundColor: 'transparent'
  },
  closeScannerBtn: {
    position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24, padding: 8
  }
});
