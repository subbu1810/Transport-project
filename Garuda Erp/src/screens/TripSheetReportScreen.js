import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, SafeAreaView, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const TripSheetCard = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.tripNumber}>{item.trip_number}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status || 'PENDING'}</Text>
        </View>
      </View>
      
      <View style={styles.cardRow}>
        <Ionicons name="calendar-outline" size={14} color="#64748b" />
        <Text style={styles.cardText}>
          {item.trip_date ? new Date(item.trip_date).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      
      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={14} color="#64748b" />
        <Text style={styles.cardText}>
          {item.dispatch_branch?.branch_name || '-'} ➔ {item.alert_branch_data?.branch_name || item.alert_branch_name || 'N/A'}
        </Text>
      </View>

      <View style={styles.partyContainer}>
        <Text style={styles.partyLabel}>Vehicle No</Text>
        <Text style={styles.partyName} numberOfLines={1}>{item.vehicle?.vehicle_number || 'N/A'}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.driverText}>{item.driver?.name || 'N/A'}</Text>
        <Text style={styles.freightText}>₹{parseFloat(item.total_freight || 0).toLocaleString()}</Text>
      </View>

      {/* Show GCs if they exist */}
      {item.waybills && item.waybills.length > 0 && (
        <>
          <TouchableOpacity 
            style={styles.expandButton} 
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={styles.expandText}>Mapped GCs ({item.waybills.length})</Text>
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
          </TouchableOpacity>
          
          {expanded && (
            <View style={styles.gcContainer}>
              {item.waybills.map((gc, index) => (
                <View key={gc.id || index} style={styles.gcItem}>
                  <Text style={styles.gcItemNumber}>{gc.gc_number}</Text>
                  <Text style={styles.gcItemCity}>
                    {gc.destination?.city_name || gc.destination?.branch_name || '-'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default function TripSheetReportScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tripsheets, setTripsheets] = useState([]);
  
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({
    fromDate: lastMonth,
    toDate: today,
  });

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchReport();
    }
  }, [user, selectedBranchId, filters.fromDate, filters.toDate]);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const currentUser = JSON.parse(userData);
        setUser(currentUser);
        setSelectedBranchId(currentUser.branch_id || 'ALL');
      }

      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load user or branches', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setTripsheets([]);
    try {
      const params = {
        from_date: filters.fromDate,
        to_date: filters.toDate,
        trip_type: 'INTERSTATE'
      };
      
      if (user?.role !== 'superadmin' && user?.branch_id) {
        params.branch_id = user.branch_id;
      } else if (user?.role === 'superadmin') {
        if (selectedBranchId && selectedBranchId !== 'ALL') {
          params.branch_id = selectedBranchId;
        } else {
          // Explicity do not pass branch_id for ALL
          delete params.branch_id;
        }
      }

      const response = await api.get('/trip-sheets', { params });
      
      if (response.data.success) {
        setTripsheets(response.data.data || []);
        if ((response.data.data || []).length === 0) {
          Alert.alert('No Data', 'No tripsheet records found for the selected filters.');
        }
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch report.');
      }
    } catch (error) {
      console.error('Error fetching tripsheet report:', error);
      Alert.alert('Error', 'Connection failure. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const renderCard = ({ item }) => <TripSheetCard item={item} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tripsheet Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterCol}>
            <Text style={styles.label}>From Date</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowFromPicker(true)}>
              <Text style={styles.inputText}>{filters.fromDate}</Text>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>
            {showFromPicker && (
              <DateTimePicker
                value={new Date(filters.fromDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowFromPicker(false);
                  if (selectedDate) setFilters({ ...filters, fromDate: selectedDate.toISOString().split('T')[0] });
                }}
              />
            )}
          </View>
          <View style={styles.filterCol}>
            <Text style={styles.label}>To Date</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowToPicker(true)}>
              <Text style={styles.inputText}>{filters.toDate}</Text>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>
            {showToPicker && (
              <DateTimePicker
                value={new Date(filters.toDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowToPicker(false);
                  if (selectedDate) setFilters({ ...filters, toDate: selectedDate.toISOString().split('T')[0] });
                }}
              />
            )}
          </View>
        </View>

        {user?.role === 'superadmin' && (
          <>
            <Text style={styles.label}>Dispatch Branch</Text>
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
          </>
        )}

        <TouchableOpacity style={styles.searchBtn} onPress={fetchReport}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.searchBtnText}>Get Details</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={tripsheets}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No records to display.</Text>
            </View>
          )
        }
      />
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
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterCol: {
    flex: 0.48,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  inputText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  searchBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  searchBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2563eb',
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 6,
    fontWeight: '500',
  },
  partyContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  partyLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  partyName: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '700',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  driverText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  freightText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  gcContainer: {
    paddingTop: 8,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  gcItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  gcItemNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  gcItemCity: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});
