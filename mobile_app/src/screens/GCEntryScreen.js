import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
  Alert, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Modal, FlatList,
  LayoutAnimation, UIManager
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

// Custom Searchable Dropdown Component
const CustomSelect = ({ label, value, options, onSelect, placeholder, disabled }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find(o => o.id?.toString() === value?.toString());
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={[styles.input, disabled && { backgroundColor: '#f1f5f9' }]} 
        onPress={() => !disabled && setModalVisible(true)}
      >
        <Text style={{ color: selectedOption ? '#0f172a' : '#94a3b8' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Select {label}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ padding: 15 }}>
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search..." 
              value={search} 
              onChangeText={setSearch} 
            />
          </View>
          <FlatList 
            data={filteredOptions}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  onSelect(item.id);
                  setModalVisible(false);
                  setSearch('');
                }}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

// Inline Segmented Control for small option lists (2-3 items)
const SegmentedControl = ({ label, value, options, onSelect }) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 }}>
        {options.map(opt => {
          const isSelected = value === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                backgroundColor: isSelected ? '#ffffff' : 'transparent',
                borderRadius: 8,
                shadowColor: isSelected ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: isSelected ? 2 : 0,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#0f172a' : '#64748b' }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function GCEntryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Master Data
  const [branches, setBranches] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [consignors, setConsignors] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [articleTypes, setArticleTypes] = useState([]);
  const [rates, setRates] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    billDate: new Date().toISOString().split('T')[0],
    from: '',
    to: '',
    consignor: '',
    consignee: '',
    articleDesc: '',
    totalArticles: '0',
    freight: '0.00',
    dd: '0.00',
    handling: '0.00',
    stationary: '0.00',
    totalAmount: '0.00',
    invoiceNo: '',
    declared: '',
    eWayBillNo: '',
    taxPayableBy: 'consignor',
    accountType: 'to_pay',
    gstPercent: '0',
    gstAmount: '0.00',
    grandTotal: '0.00',
    remarks: '',
    cashReceived: false,
  });

  const [articles, setArticles] = useState([
    { id: 1, type: '', noOfArticles: '', rate: 0, total: 0, ddRate: 0, ddTotal: 0, handlingRate: 0, handlingTotal: 0, freight: 0, actWt: '', chargedWt: '', amount: 0 }
  ]);

  // Auth State
  const [currentUser, setCurrentUser] = useState(null);

  // Accordion State
  const [activeSection, setActiveSection] = useState('route');

  const toggleSection = (section) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSection(activeSection === section ? null : section);
  };

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        setCurrentUser(user);

        const response = await api.get('/waybills/init-data');
        if (response.data.success) {
          const { branches: br, destinations: dest, consignors: cons, consignees: cnse, lookups, rates: rts } = response.data.data;
          
          let filteredBranches = br || [];
          let filteredConsignors = cons || [];
          
          if (user && user.role !== 'superadmin') {
            filteredBranches = filteredBranches.filter(b => b.id === user.branch_id);
            if (filteredBranches.length > 0) {
              setFormData(prev => ({ ...prev, from: user.branch_id }));
            }
            
            // Filter consignors to only show those belonging to the user's branch
            filteredConsignors = filteredConsignors.filter(c => c.branch_id === user.branch_id);
          }

          setBranches(filteredBranches);
          setDestinations(dest || []);
          setConsignors(filteredConsignors);
          setConsignees(cnse || []);
          setArticleTypes(lookups || []);
          setRates(rts || []);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch master data from server');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculation Engine
  useEffect(() => {
    let totals = { articles: 0, freight: 0, dd: 0, handling: 0 };

    articles.forEach(a => {
      totals.articles += (parseFloat(a.noOfArticles) || 0);
      totals.freight += (parseFloat(a.amount) || 0);
      totals.dd += (parseFloat(a.ddTotal) || 0);
      totals.handling += (parseFloat(a.handlingTotal) || 0);
    });

    const stationary = parseFloat(formData.stationary) || 0;
    const subTotal = totals.freight + totals.dd + totals.handling + stationary;
    const gstPercent = parseFloat(formData.gstPercent) || 0;
    const gstAmount = (subTotal * gstPercent) / 100;
    const grandTotal = subTotal + gstAmount;

    setFormData(prev => ({
      ...prev,
      totalArticles: totals.articles.toString(),
      freight: totals.freight.toFixed(2),
      dd: totals.dd.toFixed(2),
      handling: totals.handling.toFixed(2),
      totalAmount: subTotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    }));
  }, [articles, formData.stationary, formData.gstPercent]);

  // Article Calculation logic (Simplified for mobile)
  const calculateArticle = (updated) => {
    const qty = parseFloat(updated.noOfArticles) || 0;
    const chgWt = parseFloat(updated.chargedWt) || 0;
    const freightPerKg = parseFloat(updated.freight) || 0;
    const rate = parseFloat(updated.rate) || 0;
    
    // Total freight uses Weight * FreightPerKg if available, else Qty * Rate
    const amount = (freightPerKg > 0) ? (chgWt * freightPerKg) : (qty * rate);
    const ddTotal = qty * (parseFloat(updated.ddRate) || 0);
    const handlingTotal = qty * (parseFloat(updated.handlingRate) || 0);

    return { ...updated, amount, ddTotal, handlingTotal };
  };

  const handleArticleChange = (id, field, value) => {
    setArticles(articles.map(a => {
      if (a.id === id) {
        let updated = { ...a, [field]: value };
        return calculateArticle(updated);
      }
      return a;
    }));
  };

  const addArticle = () => {
    setArticles([...articles, { 
      id: Date.now(), type: '', noOfArticles: '', rate: 0, total: 0, 
      ddRate: 0, ddTotal: 0, handlingRate: 0, handlingTotal: 0, freight: 0, 
      actWt: '', chargedWt: '', amount: 0 
    }]);
  };

  const removeArticle = (id) => {
    if (articles.length > 1) {
      setArticles(articles.filter(a => a.id !== id));
    }
  };

  const handleSubmit = async () => {
    if (!formData.from || !formData.to || !formData.consignor || !formData.consignee) {
      Alert.alert('Validation Error', 'Please fill all mandatory Waybill and Party details.');
      return;
    }

    const declaredValue = parseFloat(formData.declared) || 0;
    if (declaredValue > 49999 && (!formData.eWayBillNo || formData.eWayBillNo.trim() === '')) {
      Alert.alert('Validation Error', 'Declared Value exceeds ₹49,999. E-Way Bill No. is mandatory.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        bill_date: formData.billDate,
        origin_branch_id: parseInt(formData.from),
        destination_id: parseInt(formData.to),
        consignor_id: parseInt(formData.consignor),
        consignee_id: parseInt(formData.consignee),
        article_desc: formData.articleDesc,
        total_articles: parseInt(formData.totalArticles) || 0,
        freight_amount: parseFloat(formData.freight) || 0,
        dd_charges: parseFloat(formData.dd) || 0,
        handling_charges: parseFloat(formData.handling) || 0,
        stationary_charges: parseFloat(formData.stationary) || 0,
        total_amount: parseFloat(formData.totalAmount) || 0,
        invoice_no: formData.invoiceNo,
        declared_value: parseFloat(formData.declared) || 0,
        eway_bill_no: formData.eWayBillNo,
        tax_payable_by: formData.taxPayableBy,
        account_type: formData.accountType,
        cash_received: formData.accountType === 'paid' ? formData.cashReceived : false,
        gst_percent: parseFloat(formData.gstPercent) || 0,
        gst_amount: parseFloat(formData.gstAmount) || 0,
        grand_total: parseFloat(formData.grandTotal) || 0,
        remarks: formData.remarks,
        created_by: currentUser ? currentUser.id : null,
        booking_clerk: currentUser ? (currentUser.full_name || currentUser.name || 'ADMIN') : 'ADMIN',
        articles: articles.map(art => ({
          article_type: art.type,
          no_of_articles: parseInt(art.noOfArticles) || 0,
          rate: parseFloat(art.rate) || 0,
          total: parseFloat(art.total) || 0,
          handling_rate: parseFloat(art.handlingRate) || 0,
          handling_total: parseFloat(art.handlingTotal) || 0,
          dd_rate: parseFloat(art.ddRate) || 0,
          dd_total: parseFloat(art.ddTotal) || 0,
          freight: parseFloat(art.freight) || 0,
          actual_weight: parseFloat(art.actWt) || 0,
          charged_weight: parseFloat(art.chargedWt) || 0,
          amount: parseFloat(art.amount) || 0
        }))
      };

      const response = await api.post('/waybills', payload);
      if (response.data.success) {
        Alert.alert('Success', 'GC Saved Successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to save GC');
      }
    } catch (error) {
      Alert.alert('Error', 'Server Error saving GC');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Loading Master Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New GC Entry</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          {/* SECTION 1: ROUTE & PARTY DETAILS */}
          <View style={styles.accordionCard}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('route')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                  <Ionicons name="location" size={20} color="#4f46e5" />
                </View>
                <Text style={styles.accordionTitle}>Route & Party Details</Text>
              </View>
              <Ionicons name={activeSection === 'route' ? 'chevron-up' : 'chevron-down'} size={24} color="#64748b" />
            </TouchableOpacity>

            {activeSection === 'route' && (
              <View style={styles.accordionBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bill Date</Text>
                  <TouchableOpacity 
                    style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: '#0f172a', fontSize: 15 }}>{formData.billDate}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#64748b" />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(formData.billDate)}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setFormData({ ...formData, billDate: selectedDate.toISOString().split('T')[0] });
                        }
                      }}
                    />
                  )}
                </View>
                <CustomSelect 
                  label="From Branch" value={formData.from} 
                  options={branches.map(b => ({id: b.id, label: b.branch_name}))}
                  onSelect={v => setFormData({...formData, from: v})} 
                  placeholder="Select Branch" 
                  disabled={currentUser && currentUser.role !== 'superadmin'}
                />
                <CustomSelect 
                  label="To Destination" value={formData.to} 
                  options={destinations.map(d => ({id: d.id, label: d.city_name || d.branch_name}))}
                  onSelect={v => setFormData({...formData, to: v, consignee: ''})} placeholder="Select Destination" 
                />
                <CustomSelect 
                  label="Consignor (Sender)" value={formData.consignor} 
                  options={consignors.map(c => ({id: c.id, label: `${c.name} (${c.code || 'N/A'})`}))}
                  onSelect={v => setFormData({...formData, consignor: v})} placeholder="Select Consignor" 
                />
                <CustomSelect 
                  label="Consignee (Receiver)" value={formData.consignee} 
                  options={consignees.filter(c => !formData.to || parseInt(c.destination_id) === parseInt(formData.to)).map(c => ({id: c.id, label: c.name}))}
                  onSelect={v => setFormData({...formData, consignee: v})} placeholder="Select Consignee" 
                />
                <SegmentedControl 
                  label="Pay Type" value={formData.accountType} 
                  options={[{id: 'to_pay', label: 'To Pay'}, {id: 'paid', label: 'Paid'}, {id: 'tbb', label: 'Account'}]}
                  onSelect={v => setFormData({...formData, accountType: v})} 
                />
                <SegmentedControl 
                  label="Tax By" value={formData.taxPayableBy} 
                  options={[{id: 'consignor', label: 'Consignor'}, {id: 'consignee', label: 'Consignee'}]}
                  onSelect={v => setFormData({...formData, taxPayableBy: v})} 
                />

                {formData.accountType === 'paid' && (
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' }}
                    onPress={() => setFormData({...formData, cashReceived: !formData.cashReceived})}
                  >
                    <Ionicons name={formData.cashReceived ? "checkbox" : "square-outline"} size={24} color="#16a34a" />
                    <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#166534' }}>Cash Collected?</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* SECTION 2: ARTICLES */}
          <View style={styles.accordionCard}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('articles')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="cube" size={20} color="#d97706" />
                </View>
                <Text style={styles.accordionTitle}>Articles ({articles.length})</Text>
              </View>
              <Ionicons name={activeSection === 'articles' ? 'chevron-up' : 'chevron-down'} size={24} color="#64748b" />
            </TouchableOpacity>

            {activeSection === 'articles' && (
              <View style={[styles.accordionBody, { backgroundColor: '#f8fafc' }]}>
                {articles.map((item, index) => (
                  <View key={item.id} style={styles.articleCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>Item #{index + 1}</Text>
                      {articles.length > 1 && (
                        <TouchableOpacity onPress={() => removeArticle(item.id)}>
                          <Ionicons name="trash" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <CustomSelect 
                      label="Article Type" value={item.type} 
                      options={articleTypes.map(t => ({id: t.code, label: t.code}))}
                      onSelect={v => handleArticleChange(item.id, 'type', v)} placeholder="Select Type" 
                    />
                    
                    <View style={styles.row}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Qty</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={item.noOfArticles} onChangeText={v => handleArticleChange(item.id, 'noOfArticles', v)} />
                      </View>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Act Wt</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={item.actWt} onChangeText={v => handleArticleChange(item.id, 'actWt', v)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Chg Wt</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={item.chargedWt} onChangeText={v => handleArticleChange(item.id, 'chargedWt', v)} />
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Freight / Kg</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={item.freight.toString()} onChangeText={v => handleArticleChange(item.id, 'freight', v)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Total Freight</Text>
                        <View style={[styles.input, { backgroundColor: '#f1f5f9', justifyContent: 'center' }]}>
                          <Text style={{ fontWeight: 'bold', color: '#16a34a' }}>₹ {item.amount.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>DD Rate</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={item.ddRate.toString()} onChangeText={v => handleArticleChange(item.id, 'ddRate', v)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>DD Total</Text>
                        <View style={[styles.input, { backgroundColor: '#f1f5f9', justifyContent: 'center' }]}>
                          <Text style={{ fontWeight: 'bold' }}>₹ {item.ddTotal.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Handling Rate</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={item.handlingRate.toString()} onChangeText={v => handleArticleChange(item.id, 'handlingRate', v)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Handling Total</Text>
                        <View style={[styles.input, { backgroundColor: '#f1f5f9', justifyContent: 'center' }]}>
                          <Text style={{ fontWeight: 'bold' }}>₹ {item.handlingTotal.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity style={styles.addBtn} onPress={addArticle}>
                  <Ionicons name="add-circle" size={20} color="#4f46e5" style={{ marginRight: 5 }} />
                  <Text style={styles.addBtnText}>Add Article</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* SECTION 3: CHARGES */}
          <View style={styles.accordionCard}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('charges')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="cash" size={20} color="#16a34a" />
                </View>
                <Text style={styles.accordionTitle}>Charges</Text>
              </View>
              <Ionicons name={activeSection === 'charges' ? 'chevron-up' : 'chevron-down'} size={24} color="#64748b" />
            </TouchableOpacity>

            {activeSection === 'charges' && (
              <View style={styles.accordionBody}>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Handling (₹)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={formData.handling} onChangeText={t => setFormData({...formData, handling: t})} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Door Delivery (₹)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={formData.dd} onChangeText={t => setFormData({...formData, dd: t})} />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Stationary (₹)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={formData.stationary} onChangeText={t => setFormData({...formData, stationary: t})} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>GST %</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={formData.gstPercent} onChangeText={t => setFormData({...formData, gstPercent: t})} />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* SECTION 4: ADDITIONAL INFO */}
          <View style={styles.accordionCard}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('info')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="document-text" size={20} color="#9333ea" />
                </View>
                <Text style={styles.accordionTitle}>Additional Info</Text>
              </View>
              <Ionicons name={activeSection === 'info' ? 'chevron-up' : 'chevron-down'} size={24} color="#64748b" />
            </TouchableOpacity>

            {activeSection === 'info' && (
              <View style={styles.accordionBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-Way Bill No</Text>
                  <TextInput style={styles.input} value={formData.eWayBillNo} onChangeText={t => setFormData({...formData, eWayBillNo: t})} />
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Invoice No</Text>
                    <TextInput style={styles.input} value={formData.invoiceNo} onChangeText={t => setFormData({...formData, invoiceNo: t})} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Invoice Value (₹)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={formData.declared} onChangeText={t => setFormData({...formData, declared: t})} />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Remarks</Text>
                  <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline value={formData.remarks} onChangeText={t => setFormData({...formData, remarks: t})} />
                </View>
              </View>
            )}
          </View>

        </ScrollView>

        {/* STICKY FOOTER */}
        <View style={styles.stickyFooter}>
          <View style={styles.footerTotals}>
            <Text style={styles.footerLabel}>Grand Total</Text>
            <Text style={styles.footerValue}>₹ {formData.grandTotal}</Text>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
            <Text style={styles.submitBtnText}>{saving ? 'Saving...' : 'Generate GC'}</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  container: { padding: 15, paddingBottom: 100 }, // Extra padding for sticky footer
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  
  // Accordion Styles
  accordionCard: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 15, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: '#ffffff' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  accordionBody: { padding: 18, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  
  // Article Styles
  articleCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
  
  addBtn: { backgroundColor: '#e0e7ff', flexDirection: 'row', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#818cf8', borderStyle: 'dashed' },
  addBtnText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 15 },
  
  // Sticky Footer
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', padding: 15, paddingBottom: Platform.OS === 'ios' ? 25 : 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  footerTotals: { flex: 1 },
  footerLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  footerValue: { fontSize: 24, fontWeight: '900', color: '#16a34a' },
  submitBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, elevation: 2 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  
  // Modal styles
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  searchInput: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 10 },
  modalItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff' },
  modalItemText: { fontSize: 16, color: '#334155' }
});
