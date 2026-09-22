import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PRESET_TRANSPORTS,
  getTransportConfig,
  setTransportConfig,
  parseQRData
} from '../services/transportConfig';


export default function CompanySetupScreen({ navigation, route }) {
  const canCancel = route.params?.canCancel ?? false;

  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);

  useEffect(() => {
    loadCurrent();
  }, []);

  const loadCurrent = async () => {
    const cfg = await getTransportConfig();
    setCurrentConfig(cfg);
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (!data || loading) return;
    setIsScannerOpen(false);

    try {
      setLoading(true);
      const parsed = parseQRData(data);
      await applyConfig(parsed);
    } catch (err) {
      Alert.alert('Scan Failed', err.message || 'Could not read valid QR code.');
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is needed to scan your transport QR code.'
        );
        return;
      }
    }
    setIsScannerOpen(true);
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Input Required', 'Please enter a Transport Code or URL.');
      return;
    }

    try {
      setLoading(true);
      const parsed = parseQRData(manualCode.trim());
      await applyConfig(parsed);
    } catch (err) {
      Alert.alert('Invalid Code', err.message || 'Could not connect with this code.');
    } finally {
      setLoading(false);
    }
  };

  const applyConfig = async (config) => {
    try {
      await setTransportConfig(config);
      // Clear previous user session when switching to a new company
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setCurrentConfig(config);
      Alert.alert(
        'Connected Successfully! 🎉',
        `App is now connected to:\n\n${config.name} (${config.code})`,
        [
          {
            text: 'Continue to Login',
            onPress: () => navigation.replace('Login')
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to save configuration.');
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Bar */}
      <View style={styles.header}>
        {canCancel ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Transport Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Branding & Welcome */}
        <View style={styles.brandBox}>
          <Image
            source={require('../../assets/garuda-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.mainTitle}>Connect Your Transport</Text>
          <Text style={styles.subtitle}>
            Scan the QR code displayed at your transport office or select your company below.
          </Text>
        </View>

        {/* Current Active Connection (if configured) */}
        {currentConfig && (
          <View style={styles.currentCard}>
            <View style={styles.currentIconBox}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.currentLabel}>Currently Connected To:</Text>
              <Text style={styles.currentName}>{currentConfig.name}</Text>
              <Text style={styles.currentCode}>Code: {currentConfig.code}</Text>
            </View>
          </View>
        )}

        {/* PRIMARY: Scan QR Button */}
        <TouchableOpacity
          style={styles.scanPrimaryBtn}
          onPress={openCamera}
          activeOpacity={0.85}
          disabled={loading}
        >
          <View style={styles.scanIconCircle}>
            <Ionicons name="qr-code-outline" size={32} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scanPrimaryText}>Scan Transport QR Code</Text>
            <Text style={styles.scanSecondaryText}>Point camera at company barcode</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR QUICK SELECT</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Preset Companies List */}
        <View style={styles.presetsContainer}>
          {PRESET_TRANSPORTS.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.presetCard,
                currentConfig?.code === item.code && styles.presetCardActive
              ]}
              onPress={() => applyConfig(item)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={[styles.presetDot, { backgroundColor: item.color || '#2563eb' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.presetName}>{item.name}</Text>
                <Text style={styles.presetCode}>Code: {item.code}</Text>
              </View>
              {currentConfig?.code === item.code ? (
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              ) : (
                <Text style={styles.selectText}>Select</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR ENTER CODE MANUALLY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual Code Input */}
        <View style={styles.manualCard}>
          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color="#64748b" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. LIFE, GARUDA, or API URL"
              placeholderTextColor="#94a3b8"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity
            style={styles.connectBtn}
            onPress={handleManualSubmit}
            disabled={loading || !manualCode.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.connectBtnText}>Connect</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* CAMERA SCANNER MODAL */}
      <Modal visible={isScannerOpen} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.scannerSafeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setIsScannerOpen(false)} style={styles.scannerActionBtn}>
              <Ionicons name="close" size={26} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.scannerHeaderTitle}>Scan Transport QR</Text>
            <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.scannerActionBtn}>
              <Ionicons
                name={torch ? "flash" : "flash-outline"}
                size={24}
                color={torch ? "#fbbf24" : "#ffffff"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torch}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr']
              }}
            />

            {/* Target Reticle Overlay */}
            <View style={styles.overlayContainer}>
              <View style={styles.reticleBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scannerInstruction}>
                Center the QR code inside the frame
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  backBtn: {
    padding: 4,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 140,
    height: 70,
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 15,
    lineHeight: 20,
  },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  currentIconBox: {
    marginRight: 12,
  },
  currentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
  },
  currentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065f46',
  },
  currentCode: {
    fontSize: 12,
    color: '#047857',
  },
  scanPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  scanIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scanPrimaryText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  scanSecondaryText: {
    fontSize: 12,
    color: '#64748b',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  presetsContainer: {
    marginBottom: 10,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  presetCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  presetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  presetName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  presetCode: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  selectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  manualCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  connectBtn: {
    backgroundColor: '#0f172a',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  // SCANNER MODAL STYLES
  scannerSafeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  scannerActionBtn: {
    padding: 6,
  },
  scannerHeaderTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  cameraWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleBox: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#38bdf8',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerInstruction: {
    marginTop: 28,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
