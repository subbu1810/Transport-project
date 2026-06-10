import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
  Alert, SafeAreaView, ActivityIndicator, LayoutAnimation, UIManager, Platform, Image, Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { API_URL } from '../services/api';

const STORAGE_URL = API_URL.replace('/api/v1', '/storage');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const statusConfig = {
  'PENDING': { color: '#d97706', bg: '#fef3c7', text: 'PENDING' },
  'DISPATCHED': { color: '#2563eb', bg: '#dbeafe', text: 'DISPATCHED' },
  'LOCAL_TRIP': { color: '#9333ea', bg: '#f3e8ff', text: 'LOCAL TRIP' },
  'RECEIVED': { color: '#0d9488', bg: '#ccfbf1', text: 'RECEIVED' },
  'INWARDED': { color: '#0d9488', bg: '#ccfbf1', text: 'INWARDED' },
  'Delivered': { color: '#16a34a', bg: '#dcfce7', text: 'DELIVERED' },
  'RTO (Return to Origin)': { color: '#dc2626', bg: '#fee2e2', text: 'RTO' },
  'Out for Delivery': { color: '#0891b2', bg: '#cffafe', text: 'OUT FOR DELIVERY' },
  'Arrived at Destination': { color: '#4f46e5', bg: '#e0e7ff', text: 'ARRIVED' },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { color: '#64748b', bg: '#f1f5f9', text: status || 'UNKNOWN' };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.color }]}>
      <View style={[styles.badgeDot, { backgroundColor: config.color }]} />
      <Text style={[styles.badgeText, { color: config.color }]}>{config.text}</Text>
    </View>
  );
};

export default function GCTrackScreen({ navigation }) {
  const [gcNumber, setGcNumber] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchGC = async () => {
    if (!gcNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a GC Number to track.');
      return;
    }
    
    setLoading(true);
    setTrackingData(null);
    try {
      const response = await api.get(`/waybills/search/${gcNumber.toUpperCase()}`);
      if (response.data.success && response.data.data) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTrackingData(response.data.data);
      } else {
        Alert.alert('Not Found', 'No GC found with this number.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch tracking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderTimeline = () => {
    if (!trackingData) return null;

    const timeline = [];
    
    // 1. Booked
    timeline.push({
      title: 'GC Booked',
      date: formatDate(trackingData.bill_date),
      desc: `Booked by ${trackingData.consignor?.name || 'Consignor'} at ${trackingData.origin_branch?.branch_name || 'Origin'}`,
      icon: 'document-text',
      color: '#3b82f6',
      done: true
    });

    // 2. Dispatched
    if (trackingData.trip_sheets?.length > 0) {
      timeline.push({
        title: 'Dispatched',
        date: formatDate(trackingData.trip_sheets[0].dispatch_date || trackingData.trip_sheets[0].trip_date),
        desc: `Trip No: ${trackingData.trip_sheets[0].trip_number} - Vehicle: ${trackingData.trip_sheets[0].vehicle?.vehicle_number || ''}`,
        icon: 'bus',
        color: '#d97706',
        done: true
      });
    }

    // 3. Inwarded
    if (trackingData.inward_at) {
      timeline.push({
        title: 'Inwarded / Arrived',
        date: formatDate(trackingData.inward_at),
        desc: `Received at ${trackingData.inward_branch?.branch_name || 'Destination Branch'}`,
        icon: 'archive',
        color: '#9333ea',
        done: true
      });
    }

    // 4. Delivered
    if (trackingData.status?.toUpperCase().includes('DELIVERED') || trackingData.deliver_status?.toUpperCase() === 'DELIVERED') {
      timeline.push({
        title: 'Delivered',
        date: formatDate(trackingData.delivered_at),
        desc: 'Shipment has been delivered to the consignee.',
        icon: 'checkmark-circle',
        color: '#10b981',
        done: true
      });
    }

    // 5. Consignor Report & ACK Bundle
    if (trackingData.consignor_receipts?.length > 0) {
      timeline.push({
        title: 'Consignor Billed',
        date: formatDate(trackingData.consignor_receipts[0].transaction_date),
        desc: `Report ID: ${trackingData.consignor_receipts[0].receipt_no}`,
        icon: 'receipt',
        color: '#8b5cf6',
        done: true
      });
    }
    
    if (trackingData.ack_bundle) {
      timeline.push({
        title: 'ACK Bundled',
        date: formatDate(trackingData.ack_bundle.bundle_date),
        desc: `Bundle ID: ${trackingData.ack_bundle.bundle_number}`,
        icon: 'file-tray-stacked',
        color: '#14b8a6',
        done: true
      });
    }

    // Pending state
    if (!trackingData.status?.toUpperCase().includes('DELIVERED') && trackingData.status?.toUpperCase() !== 'CANCELLED') {
       timeline.push({
         title: 'Awaiting Arrival',
         date: '—',
         desc: 'Shipment is in transit.',
         icon: 'time',
         color: '#cbd5e1',
         done: false
       });
    }

    return (
      <View style={styles.card}>
        <View style={[styles.cardHeader, { backgroundColor: '#334155' }]}>
          <Ionicons name="git-commit" size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.cardHeaderTitle}>Tracking Lifecycle</Text>
        </View>
        <View style={styles.cardBody}>
          {timeline.map((item, index) => (
             <View key={index} style={styles.timelineRow}>
               <View style={styles.timelineIconBox}>
                  <View style={[styles.timelineIcon, { backgroundColor: item.done ? item.color : '#f1f5f9' }]}>
                    <Ionicons name={item.icon} size={16} color={item.done ? '#fff' : '#cbd5e1'} />
                  </View>
                  {index < timeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: item.done ? item.color : '#e2e8f0' }]} />}
               </View>
               <View style={styles.timelineContent}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                     <Text style={[styles.timelineTitle, { color: item.done ? '#0f172a' : '#94a3b8' }]}>{item.title}</Text>
                     <Text style={styles.timelineDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.timelineDesc}>{item.desc}</Text>
               </View>
             </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GC Live Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* HERO SEARCH HEADER */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Ionicons name="flash" size={24} color="#fbc02d" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Track Shipment</Text>
              <Text style={styles.heroSubtitle}>Real-time status & journey history</Text>
            </View>
          </View>
          
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" style={{ marginRight: 8 }} />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Enter GC Number..." 
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={gcNumber} 
                onChangeText={setGcNumber} 
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity 
              style={[styles.searchBtn, loading && { opacity: 0.7 }]}
              onPress={searchGC}
              disabled={loading || !gcNumber}
            >
              {loading ? <ActivityIndicator color="#1b2e0a" /> : <Text style={styles.searchBtnText}>Track</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* EMPTY STATE */}
        {!trackingData && !loading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="cube-outline" size={40} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>Track Your Shipment</Text>
            <Text style={styles.emptyDesc}>Enter a GC Number above to see real-time tracking details</Text>
          </View>
        )}

        {/* RESULTS */}
        {trackingData && (
          <View style={styles.resultsContainer}>
            {/* OVERVIEW BANNER */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.overviewIconBox}>
                    <Ionicons name="document-text" size={24} color="#ffffff" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.overviewLabel}>Consignment Note</Text>
                    <Text style={styles.overviewNumber}>{trackingData.gc_number}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.overviewFooter}>
                <View style={styles.statusBlock}>
                  <Text style={styles.statusLabel}>Current Status</Text>
                  <StatusBadge status={trackingData.status} />
                </View>
                <View style={styles.statusBlock}>
                  <Text style={styles.statusLabel}>Payment</Text>
                  <View style={[styles.badge, trackingData.amount_paid > 0 ? { backgroundColor: '#dcfce7', borderColor: '#16a34a' } : { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}>
                    <Text style={[styles.badgeText, trackingData.amount_paid > 0 ? { color: '#16a34a' } : { color: '#ef4444' }]}>
                      {trackingData.amount_paid > 0 ? '✓ PAID' : '✗ UNPAID'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ROUTE DETAILS */}
            <View style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: '#2563eb' }]}>
                <Ionicons name="map" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.cardHeaderTitle}>Route Details</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.routeRow}>
                  <View style={styles.routePoint}>
                    <Ionicons name="location" size={24} color="#ef4444" />
                    <Text style={styles.routeCity}>{trackingData.origin_branch?.branch_name || 'Origin'}</Text>
                    <Text style={styles.routeParty}>{trackingData.consignor?.name || '—'}</Text>
                  </View>
                  <View style={styles.routeLine}>
                    <Ionicons name="arrow-forward" size={24} color="#cbd5e1" />
                  </View>
                  <View style={styles.routePoint}>
                    <Ionicons name="location" size={24} color="#10b981" />
                    <Text style={styles.routeCity}>{trackingData.destination?.city_name || trackingData.destination?.branch_name || 'Dest'}</Text>
                    <Text style={styles.routeParty}>{trackingData.consignee?.name || '—'}</Text>
                  </View>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Bill Date</Text>
                    <Text style={styles.infoValue}>{formatDate(trackingData.bill_date)}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Account Type</Text>
                    <Text style={styles.infoValue}>{trackingData.account_type?.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* TRIP STATUS */}
            <View style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: '#d97706' }]}>
                <Ionicons name="bus" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.cardHeaderTitle}>Outward / Trip Status</Text>
              </View>
              <View style={styles.cardBody}>
                {trackingData.trip_sheets?.length > 0 ? (
                  <>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Trip Number</Text>
                        <Text style={[styles.infoValue, { color: '#2563eb' }]}>{trackingData.trip_sheets[0].trip_number}</Text>
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Trip Date</Text>
                        <Text style={styles.infoValue}>{formatDate(trackingData.trip_sheets[0].dispatch_date)}</Text>
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Vehicle No</Text>
                        <Text style={styles.infoValue}>{trackingData.trip_sheets[0].vehicle?.vehicle_number || '—'}</Text>
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Driver</Text>
                        <Text style={styles.infoValue}>{trackingData.trip_sheets[0].driver?.name || '—'}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyStateInner}>
                    <Ionicons name="time-outline" size={32} color="#fcd34d" />
                    <Text style={styles.emptyTitleInner}>No Trip Assigned</Text>
                    <Text style={styles.emptyDescInner}>This GC has not been dispatched yet.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* INWARD STATUS */}
            <View style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: '#9333ea' }]}>
                <Ionicons name="archive" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.cardHeaderTitle}>Inward / Ack Status</Text>
              </View>
              <View style={styles.cardBody}>
                {trackingData.inward_at ? (
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Inward Branch</Text>
                      <Text style={[styles.infoValue, { color: '#9333ea' }]}>{trackingData.inward_branch?.branch_name || `Branch #${trackingData.inward_branch_id}`}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Inward Date</Text>
                      <Text style={styles.infoValue}>{formatDate(trackingData.inward_at)}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <Text style={[styles.infoValue, { color: '#0d9488' }]}>RECEIVED</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyStateInner}>
                    <Ionicons name="cube-outline" size={32} color="#d8b4fe" />
                    <Text style={styles.emptyTitleInner}>Not Yet Inwarded</Text>
                    <Text style={styles.emptyDescInner}>Shipment hasn't arrived at destination branch.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* TRACKING LIFECYCLE */}
            {renderTimeline()}

            {/* RATE & ARTICLE DETAILS */}
            <View style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: '#475569' }]}>
                <Ionicons name="list" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.cardHeaderTitle}>Rate & Article Details</Text>
              </View>
              <View style={styles.cardBody}>
                {trackingData.articles?.map((art, idx) => (
                  <View key={idx} style={styles.articleCard}>
                    <View style={styles.articleHeader}>
                       <Text style={styles.articleType}>{art.article_type || 'Article'}</Text>
                       <Text style={styles.articleQty}>Qty: {art.no_of_articles || 0}</Text>
                    </View>
                    <View style={styles.articleRow}>
                       <Text style={styles.articleLabel}>Actual Wt: <Text style={styles.articleValue}>{art.actual_weight || 0} kg</Text></Text>
                       <Text style={styles.articleLabel}>Charged Wt: <Text style={styles.articleValue}>{art.charged_weight || 0} kg</Text></Text>
                    </View>
                    <View style={styles.articleRow}>
                       <Text style={styles.articleLabel}>Freight: <Text style={styles.articleValue}>₹ {art.freight || 0}</Text></Text>
                       <Text style={styles.articleLabel}>Amount: <Text style={[styles.articleValue, { color: '#047857' }]}>₹ {art.amount || 0}</Text></Text>
                    </View>
                  </View>
                ))}
                
                <View style={styles.summaryBox}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Freight Amount</Text>
                    <Text style={styles.summaryValue}>₹ {trackingData.freight_amount || 0}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>DD Charges</Text>
                    <Text style={styles.summaryValue}>₹ {trackingData.dd_charges || 0}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Handling / Stationary</Text>
                    <Text style={styles.summaryValue}>₹ {(parseFloat(trackingData.handling_charges || 0) + parseFloat(trackingData.stationary_charges || 0)).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, marginTop: 5 }]}>
                    <Text style={styles.grandTotalLabel}>Grand Total</Text>
                    <Text style={styles.grandTotalValue}>₹ {trackingData.grand_total || 0}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* PROOF OF DELIVERY (POD) */}
            <View style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: '#059669' }]}>
                <Ionicons name="image" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.cardHeaderTitle}>Proof of Delivery (POD)</Text>
              </View>
              <View style={styles.cardBody}>
                {trackingData.delivery_proof ? (
                  trackingData.delivery_proof.toLowerCase().endsWith('.pdf') ? (
                     <TouchableOpacity 
                        style={styles.podPdfBtn}
                        onPress={() => Linking.openURL(`${STORAGE_URL}/${trackingData.delivery_proof}`)}
                     >
                       <Ionicons name="document-text" size={32} color="#dc2626" />
                       <Text style={styles.podPdfText}>View PDF Document</Text>
                     </TouchableOpacity>
                  ) : (
                     <Image 
                       source={{ uri: `${STORAGE_URL}/${trackingData.delivery_proof}` }} 
                       style={styles.podImage}
                       resizeMode="cover"
                     />
                  )
                ) : (
                  <View style={styles.emptyStateInner}>
                    <Ionicons name="image-outline" size={32} color="#cbd5e1" />
                    <Text style={styles.emptyTitleInner}>No POD Uploaded Yet</Text>
                    <Text style={styles.emptyDescInner}>POD will appear here once delivered.</Text>
                  </View>
                )}
              </View>
            </View>
            
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  container: { padding: 15, paddingBottom: 40 },
  
  heroCard: { backgroundColor: '#15803d', borderRadius: 20, padding: 20, marginBottom: 20, overflow: 'hidden', elevation: 8, shadowColor: '#15803d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroIconBox: { backgroundColor: 'rgba(251,192,45,0.2)', padding: 10, borderRadius: 12, marginRight: 15, borderWidth: 1, borderColor: 'rgba(251,192,45,0.4)' },
  heroTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 15, marginRight: 10, height: 50 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  searchBtn: { backgroundColor: '#fbc02d', height: 50, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  searchBtnText: { color: '#1b2e0a', fontSize: 15, fontWeight: '900' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', marginTop: 5, textAlign: 'center', paddingHorizontal: 40 },

  resultsContainer: { marginTop: 10 },
  
  overviewCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 15, elevation: 4 },
  overviewHeader: { marginBottom: 15 },
  overviewIconBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  overviewLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  overviewNumber: { color: '#ffffff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  overviewFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 },
  statusBlock: { flex: 1 },
  statusLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  card: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 15, overflow: 'hidden', elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  cardHeaderTitle: { color: '#ffffff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  cardBody: { padding: 15 },

  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  routePoint: { flex: 1, alignItems: 'center' },
  routeLine: { flex: 0.5, alignItems: 'center' },
  routeCity: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginTop: 8, textAlign: 'center' },
  routeParty: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2, textAlign: 'center' },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoCol: { width: '50%', marginBottom: 15 },
  infoLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#0f172a' },

  emptyStateInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyTitleInner: { fontSize: 14, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginTop: 10 },
  emptyDescInner: { fontSize: 12, color: '#cbd5e1', marginTop: 4 },

  timelineRow: { flexDirection: 'row', minHeight: 60 },
  timelineIconBox: { width: 40, alignItems: 'center' },
  timelineIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  timelineLine: { width: 2, flex: 1, marginTop: -2, marginBottom: -2 },
  timelineContent: { flex: 1, paddingBottom: 20, paddingLeft: 10 },
  timelineTitle: { fontSize: 13, fontWeight: '800' },
  timelineDate: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  timelineDesc: { fontSize: 11, color: '#64748b', marginTop: 4 },

  articleCard: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  articleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  articleType: { fontSize: 13, fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' },
  articleQty: { fontSize: 12, fontWeight: '800', color: '#3b82f6' },
  articleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  articleLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  articleValue: { color: '#0f172a', fontWeight: '800' },

  summaryBox: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 15, marginTop: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  summaryValue: { fontSize: 12, color: '#0f172a', fontWeight: '800' },
  grandTotalLabel: { fontSize: 14, color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' },
  grandTotalValue: { fontSize: 16, color: '#047857', fontWeight: '900' },

  podImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#f1f5f9' },
  podPdfBtn: { backgroundColor: '#fef2f2', padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fecaca' },
  podPdfText: { color: '#dc2626', fontWeight: '800', marginTop: 10, fontSize: 13 }
});
