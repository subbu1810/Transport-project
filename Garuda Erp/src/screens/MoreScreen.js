import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Share, Alert } from 'react-native';

export default function MoreScreen({ navigation }) {
  const moreItems = [
    { id: 'GCReport', title: 'GC Report', icon: '📊' },
    { id: 'TripSheetReport', title: 'Tripsheet Report', icon: '📑' },
    { id: 'InwardReport', title: 'Inward Report', icon: '📋' },
    { id: 'UploadPOD', title: 'Upload POD', icon: '📸' },
    { id: 'SwitchCompany', title: 'Switch Transport / Company', icon: '🏢' },
    { id: 'ShareApp', title: 'Share App', icon: '🔗' },
  ];


  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: 'Check out Garuda ERP App! Download it now to manage your transport logistics efficiently.',
        title: 'Share Garuda ERP',
        // url: 'https://play.google.com/store/apps/details?id=com.subbu1810.mobile_app', // Uncomment if you have a Play Store link
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More Options</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {moreItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.listItem}
            onPress={() => {
              if (item.id === 'SwitchCompany') {
                navigation.navigate('CompanySetup', { canCancel: true });
              } else if (item.id === 'ShareApp') {
                handleShareApp();
              } else if (item.id) {
                navigation.navigate(item.id);
              }
            }}

          >
            <Text style={styles.listIcon}>{item.icon}</Text>
            <Text style={styles.listText}>{item.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 S Square G Tech Solutions Pvt Ltd. All Rights Reserved.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: { 
    flex: 1, 
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  container: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: '#cbd5e1',
  },
  footer: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
