import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, Platform, StatusBar, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api, { API_URL } from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';

const STORAGE_URL = API_URL.replace('/api/v1', '/storage');

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [user, setUser] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      let branchId = '';
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        if (parsed.branch_id && parsed.role !== 'superadmin') {
          branchId = `?branch_id=${parsed.branch_id}`;
        }
      }

      const response = await api.get(`/dashboard/stats${branchId}`);
      if (response.data.success) {
        setStats(response.data.data.stats || []);
        setRecentTrips(response.data.data.recent_trips || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const confirmLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout of your session?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: async () => {
          try {
            await AsyncStorage.clear();
            navigation.replace('Login');
          } catch (e) {
            console.error('Failed to logout', e);
          }
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {user?.transport_logo_url ? (
            <Image 
              source={{ uri: user.transport_logo_url.startsWith('http') ? user.transport_logo_url : `${STORAGE_URL}/${user.transport_logo_url.replace(/^\/+/, '')}` }} 
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderLogoText}>{user?.transport_name ? user.transport_name.substring(0, 2).toUpperCase() : 'TR'}</Text>
            </View>
          )}
          <View style={styles.headerTitles}>
            <Text style={styles.transportName}>{user?.transport_name || 'Transport Logistics'}</Text>
            <Text style={styles.branchName}>{user?.branch_name || 'Main Branch'}</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={22} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />}
      >
        
        {/* Top Summary Banner */}
        <LinearGradient 
          colors={['#1e3a8a', '#3b82f6', '#0ea5e9']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.banner}
        >
          <View style={styles.bannerHeader}>
            <View>
              <Text style={styles.bannerTitle}>Transport Overview</Text>
              <Text style={styles.bannerSubtitle}>Welcome back, {user?.name || 'User'}</Text>
            </View>
            <View style={styles.bannerIconContainer}>
              <Ionicons name="stats-chart" size={24} color="#ffffff" />
            </View>
          </View>

          {stats.length > 0 ? (
            <View style={styles.statsGrid}>
              {stats.slice(0, 4).map((stat, idx) => {
                 let iconName = "document-text-outline";
                 const lbl = stat.label.toLowerCase();
                 if(lbl.includes('pending')) iconName = "time-outline";
                 if(lbl.includes('delivered') || lbl.includes('inward')) iconName = "checkmark-done-outline";
                 if(lbl.includes('amount') || lbl.includes('freight')) iconName = "cash-outline";

                 return (
                  <View key={idx} style={styles.statBox}>
                    <View style={styles.statIconWrapper}>
                       <Ionicons name={iconName} size={14} color="#ffffff" />
                    </View>
                    <Text style={styles.statNumber}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                 );
              })}
            </View>
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
               <ActivityIndicator color="#fff" />
            </View>
          )}
        </LinearGradient>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate('GCTrack')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="search" size={24} color="#d97706" />
            </View>
            <Text style={styles.quickActionText}>GC Track</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate('GCInward')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="barcode" size={24} color="#16a34a" />
            </View>
            <Text style={styles.quickActionText}>Scan Inward</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate('GCBulkInward')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="list" size={24} color="#059669" />
            </View>
            <Text style={styles.quickActionText}>Bulk Inward</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate('GCModify')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="create" size={24} color="#4f46e5" />
            </View>
            <Text style={styles.quickActionText}>GC Modify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate('CashBookEntry')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#fce7f3' }]}>
              <Ionicons name="wallet-outline" size={24} color="#db2777" />
            </View>
            <Text style={styles.quickActionText}>Cash Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate('UpdateDelivery')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#ccfbf1' }]}>
              <Ionicons name="checkmark-done-circle" size={24} color="#0d9488" />
            </View>
            <Text style={styles.quickActionText}>Update Delivery</Text>
          </TouchableOpacity>
        </View>

        {/* Removed Recent Trips as per user request */}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
  },
  placeholderLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  placeholderLogoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerTitles: {
    justifyContent: 'center',
  },
  transportName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  branchName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
  },
  userName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 1,
  },
  profileBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  banner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 10,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    color: '#e0f2fe',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    flexGrow: 1,
    minWidth: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statIconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#e0f2fe',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 15,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 25,
    gap: 10,
  },
  quickActionCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    flexGrow: 1,
    minWidth: 150,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 5,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  activityStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  activityDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
    fontWeight: 'bold'
  },
});
