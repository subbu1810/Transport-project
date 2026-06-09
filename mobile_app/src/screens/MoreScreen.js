import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

export default function MoreScreen({ navigation }) {
  const moreItems = [
    { id: 'GCReport', title: 'GC Report', icon: '📊' },
    { id: 'TripSheetReport', title: 'Tripsheet Report', icon: '📑' },
    { id: 'InwardReport', title: 'Inward Report', icon: '📋' },
    { id: 'UploadPOD', title: 'Upload POD', icon: '📸' },
  ];

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
              if (item.id) {
                navigation.navigate(item.id);
              } else if (item.title === 'GC Report') {
                navigation.navigate('GCReport');
              } else if (item.title === 'Inward Report') {
                navigation.navigate('InwardReport');
              } else if (item.title === 'Tripsheet Report') {
                navigation.navigate('TripSheetReport');
              }
            }}
          >
            <Text style={styles.listIcon}>{item.icon}</Text>
            <Text style={styles.listText}>{item.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
});
