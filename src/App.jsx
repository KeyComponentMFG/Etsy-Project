import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Printer, Users, Archive, Upload, ChevronRight, Check, Truck, Clock, Palette, Box, Settings, BarChart3, Plus, Minus, Trash2, Edit2, Save, X, AlertCircle, Zap, Store, ShoppingBag, Image, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Default supply categories
const DEFAULT_SUPPLY_CATEGORIES = [
  { id: 'lighting', name: 'Lighting' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'hardware', name: 'Hardware' },
  { id: 'packaging', name: 'Packaging' }
];

// Initial team members
const DEFAULT_TEAM = [
  { id: 'member1', name: 'Partner 1' },
  { id: 'member2', name: 'Partner 2' }
];

// Default stores
const DEFAULT_STORES = [
  { id: 'store1', name: 'Main Store', color: '#00ff88' }
];

export default function EtsyOrderManager() {
  const [activeTab, setActiveTab] = useState('queue');
  const [orders, setOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [filaments, setFilaments] = useState({});
  const [models, setModels] = useState([]);
  const [externalParts, setExternalParts] = useState({});
  const [supplyCategories, setSupplyCategories] = useState(DEFAULT_SUPPLY_CATEGORIES);
  const [teamMembers, setTeamMembers] = useState(DEFAULT_TEAM);
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [notification, setNotification] = useState(null);
  const [csvInput, setCsvInput] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const [importStoreId, setImportStoreId] = useState('');

  // Helper function to parse color field
  const parseColorField = (colorField) => {
    const colorValues = ['sage', 'charcoal', 'navy', 'teal', 'cyan', 'magenta', 'beige', 'cream', 'ivory', 'tan', 'maroon', 'burgundy', 'olive', 'lime', 'coral', 'salmon', 'turquoise', 'indigo', 'violet', 'lavender', 'mint', 'peach', 'rose', 'bronze', 'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey', 'gold', 'silver', 'natural', 'wood', 'clear', 'transparent', 'multicolor', 'rainbow'];
    const skipLabels = ['color', 'size', 'tray color', 'stand color', 'amount', 'personalization', 'style', 'type', 'quantity', 'power type', 'not requested on this item', 'not requested', 'n/a', 'none'];
    
    const parts = colorField.split(',').map(p => p.trim()).filter(p => p);
    let extractedColor = '';
    const extraParts = [];
    
    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      
      if (skipLabels.some(label => lowerPart === label || lowerPart.startsWith('not requested'))) {
        continue;
      }
      
      let isColor = false;
      if (!extractedColor) {
        for (const color of colorValues) {
          if (lowerPart === color || lowerPart.includes(color)) {
            extractedColor = part;
            isColor = true;
            break;
          }
        }
      }
      
      if (!isColor) {
        extraParts.push(part);
      }
    }
    
    return { extractedColor, extractedExtra: extraParts.join(', ') };
  };

  // Helper function to parse a single concatenated order chunk
  const parseOrderChunk = (chunk) => {
    const trimmed = chunk.trim().replace(/\n/g, ' '); // Normalize newlines to spaces
    
    // Extract Transaction ID (10 digits at start)
    const txnMatch = trimmed.match(/^(\d{10})(.+)$/s);
    if (!txnMatch) {
      return { transactionId: '', product: trimmed, quantity: 1, variations: '', color: '', extra: '' };
    }
    
    const transactionId = txnMatch[1];
    const rest = txnMatch[2];
    
    console.log('Parsing chunk - TXN:', transactionId, 'Rest starts with:', rest.substring(0, 30));
    
    // Format: [Product Title (words, no digits)][Quantity (digit)][Variations]
    // Example: "Modern Minimalist Incense Holder | Customizable Japandi Home Decor1Tray Color, Stand Color, Sage Green, Brown"
    // Product = all characters that are NOT digits, until we hit a digit
    // Quantity = the digit(s)
    // Variations = everything after
    
    const splitMatch = rest.match(/^([^0-9]+)(\d+)(.*)$/s);
    
    let product = '';
    let quantity = 1;
    let variations = '';
    
    if (splitMatch) {
      product = splitMatch[1].trim();
      quantity = parseInt(splitMatch[2]) || 1;
      variations = splitMatch[3].trim();
      console.log('Parsed - Product:', product.substring(0, 60), '| Qty:', quantity, '| Variations:', variations.substring(0, 40));
    } else {
      // Fallback: just use everything as product
      product = rest.trim();
      console.log('Fallback - Product:', product.substring(0, 60));
    }
    
    // Parse color and extra from variations
    const { extractedColor, extractedExtra } = parseColorField(variations);
    
    return {
      transactionId,
      product,
      quantity,
      variations,
      color: extractedColor,
      extra: extractedExtra
    };
  };

  // Preview CSV parsing
  const previewCsv = (input) => {
    setCsvInput(input);
    if (!input.trim()) {
      setCsvPreview(null);
      return;
    }
    
    try {
      const rawInput = input.trim();
      const lines = rawInput.split('\n').map(l => l.trim()).filter(l => l);
      
      console.log('=== PREVIEW DEBUG ===');
      console.log('Lines:', lines.length);
      console.log('First line:', lines[0]?.substring(0, 80));
      
      // Check if first line starts with a 10-digit number (means no header row)
      const firstLineStartsWithTxn = /^\d{10}/.test(lines[0]);
      const hasTab = lines[0]?.includes('\t');
      
      console.log('First line starts with TXN ID?', firstLineStartsWithTxn);
      console.log('Has tabs?', hasTab);
      
      if (hasTab && firstLineStartsWithTxn) {
        // Tab-separated WITHOUT headers - columns are: TXN, Product, Qty, Variations
        console.log('Format: TAB-separated WITHOUT headers');
        
        const firstRow = lines[0].split('\t').map(v => v.trim());
        console.log('First row values:', firstRow);
        
        const transactionId = firstRow[0] || '';
        const product = firstRow[1] || '';
        const quantity = parseInt(firstRow[2]) || 1;
        const colorField = firstRow[3] || '';
        
        const { extractedColor, extractedExtra } = parseColorField(colorField);
        
        setCsvPreview({ 
          rowCount: lines.length,
          format: 'TAB (no headers)',
          transactionId,
          extractedProduct: product,
          extractedQuantity: quantity,
          extractedColor,
          extractedExtra,
          colorField
        });
      } else if (hasTab || lines[0]?.includes(',')) {
        // Has tabs or commas AND first line doesn't start with TXN - has headers
        console.log('Format: CSV/TSV with headers');
        
        const headerLine = lines[0];
        const delimiter = headerLine.includes('\t') ? '\t' : ',';
        const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());
        
        if (lines.length < 2) {
          setCsvPreview(null);
          return;
        }
        
        const txnIdx = headers.findIndex(h => h.includes('transaction') || h.includes('order id'));
        const productIdx = headers.findIndex(h => h.includes('product') || h.includes('item') || h.includes('title'));
        const qtyIdx = headers.findIndex(h => h.includes('quantity') || h.includes('qty'));
        const colorIdx = headers.findIndex(h => h.includes('color') || h.includes('variation'));
        
        const firstRowValues = lines[1].split(delimiter).map(v => v.trim());
        
        const transactionId = txnIdx >= 0 ? firstRowValues[txnIdx] : '';
        const product = productIdx >= 0 ? firstRowValues[productIdx] : '';
        const quantity = qtyIdx >= 0 ? parseInt(firstRowValues[qtyIdx]) || 1 : 1;
        const colorField = colorIdx >= 0 ? firstRowValues[colorIdx] : '';
        
        const { extractedColor, extractedExtra } = parseColorField(colorField);
        
        setCsvPreview({ 
          rowCount: lines.length - 1,
          format: 'CSV',
          transactionId,
          extractedProduct: product,
          extractedQuantity: quantity,
          extractedColor,
          extractedExtra,
          colorField
        });
      } else {
        // Unknown format
        console.log('Unknown format - showing as single item');
        setCsvPreview({ 
          rowCount: 1,
          format: 'UNKNOWN',
          transactionId: '',
          extractedProduct: rawInput.substring(0, 50),
          extractedQuantity: 1,
          extractedColor: '',
          extractedExtra: '',
          colorField: ''
        });
      }
    } catch (e) {
      console.error('Preview error:', e);
      setCsvPreview(null);
    }
  };

  // Load data from Supabase
  const loadData = useCallback(async (isInitialLoad = false) => {
    try {
      console.log('=== LOADING DATA FROM SUPABASE ===');

      // Fetch all data in parallel
      const [
        { data: ordersData },
        { data: archivedData },
        { data: filamentsData },
        { data: modelsData },
        { data: partsData },
        { data: categoriesData },
        { data: teamData },
        { data: storesData }
      ] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('archived_orders').select('*'),
        supabase.from('filaments').select('*'),
        supabase.from('models').select('*'),
        supabase.from('external_parts').select('*'),
        supabase.from('supply_categories').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('stores').select('*')
      ]);

      console.log('Orders from Supabase:', ordersData?.length || 0);

      // Transform orders from DB format to app format
      if (ordersData) {
        const transformedOrders = ordersData.map(o => ({
          orderId: o.order_id,
          buyerName: o.buyer_name,
          item: o.item,
          quantity: o.quantity,
          color: o.color,
          extra: o.extra,
          price: o.price,
          address: o.address,
          status: o.status,
          assignedTo: o.assigned_to,
          notes: o.notes,
          storeId: o.store_id,
          shippedAt: o.shipped_at,
          fulfilledAt: o.fulfilled_at,
          createdAt: o.created_at,
          id: o.id
        }));
        setOrders(transformedOrders);
      }

      // Transform archived orders
      if (archivedData) {
        const transformedArchived = archivedData.map(o => ({
          orderId: o.order_id,
          buyerName: o.buyer_name,
          item: o.item,
          quantity: o.quantity,
          color: o.color,
          extra: o.extra,
          price: o.price,
          address: o.address,
          status: o.status,
          assignedTo: o.assigned_to,
          notes: o.notes,
          storeId: o.store_id,
          shippedAt: o.shipped_at,
          fulfilledAt: o.fulfilled_at,
          createdAt: o.created_at,
          archivedAt: o.archived_at,
          id: o.id
        }));
        setArchivedOrders(transformedArchived);
      }

      // Transform filaments: flat array -> object keyed by member_id
      if (filamentsData) {
        const filamentsObj = {};
        filamentsData.forEach(f => {
          if (!filamentsObj[f.member_id]) filamentsObj[f.member_id] = [];
          filamentsObj[f.member_id].push({
            id: f.id,
            color: f.color,
            colorHex: f.color_hex,
            amount: f.amount,
            rolls: f.rolls
          });
        });
        setFilaments(filamentsObj);
      }

      // Transform models
      if (modelsData) {
        const transformedModels = modelsData.map(m => ({
          id: m.id,
          name: m.name,
          variantName: m.variant_name || '',
          filamentUsage: m.filament_usage,
          defaultColor: m.default_color,
          externalParts: m.external_parts || [],
          storeId: m.store_id,
          imageUrl: m.image_url || ''
        }));
        setModels(transformedModels);
      }

      // Transform external parts: flat array -> object keyed by member_id
      if (partsData) {
        const partsObj = {};
        partsData.forEach(p => {
          if (!partsObj[p.member_id]) partsObj[p.member_id] = [];
          partsObj[p.member_id].push({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            categoryId: p.category_id,
            reorderAt: p.reorder_at
          });
        });
        setExternalParts(partsObj);
      }

      // Categories, team, stores are simpler
      if (categoriesData && categoriesData.length > 0) {
        setSupplyCategories(categoriesData.map(c => ({ id: c.id, name: c.name })));
      }
      if (teamData && teamData.length > 0) {
        setTeamMembers(teamData.map(t => ({ id: t.id, name: t.name })));
      }
      if (storesData && storesData.length > 0) {
        setStores(storesData.map(s => ({ id: s.id, name: s.name, color: s.color })));
      }

      setLastRefresh(new Date());

      if (!isInitialLoad) {
        console.log('Data refreshed at', new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('Error loading from Supabase:', e);
    }
    if (isInitialLoad) {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Auto-refresh every 15 minutes (900000ms)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing data...');
      loadData(false);
    }, 15 * 60 * 1000); // 15 minutes
    
    return () => clearInterval(refreshInterval);
  }, [loadData]);

  // Track previous values to detect changes
  const prevOrdersRef = useRef(null);
  const prevArchivedRef = useRef(null);
  const prevFilamentsRef = useRef(null);
  const prevModelsRef = useRef(null);
  const prevStoresRef = useRef(null);
  const prevPartsRef = useRef(null);
  const prevTeamRef = useRef(null);
  const prevCategoriesRef = useRef(null);

  // Auto-save: Save data whenever state changes (after initial load)
  useEffect(() => {
    if (loading) return;
    if (!initialLoadComplete) {
      setInitialLoadComplete(true);
      prevOrdersRef.current = orders;
      return;
    }
    if (JSON.stringify(orders) === JSON.stringify(prevOrdersRef.current)) return;
    prevOrdersRef.current = orders;

    // Sync orders to Supabase
    const syncOrders = async () => {
      // Get current DB orders
      const { data: dbOrders } = await supabase.from('orders').select('id');
      const dbIds = new Set(dbOrders?.map(o => o.id) || []);
      const currentIds = new Set(orders.map(o => o.id || o.orderId));

      // Delete removed orders
      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('orders').delete().in('id', toDelete);
      }

      // Upsert current orders
      if (orders.length > 0) {
        const dbFormat = orders.map(o => ({
          id: o.id || o.orderId,
          order_id: o.orderId,
          buyer_name: o.buyerName,
          item: o.item,
          quantity: o.quantity,
          color: o.color,
          extra: o.extra,
          price: o.price,
          address: o.address,
          status: o.status,
          assigned_to: o.assignedTo,
          notes: o.notes,
          store_id: o.storeId,
          shipped_at: o.shippedAt,
          fulfilled_at: o.fulfilledAt,
          created_at: o.createdAt
        }));
        await supabase.from('orders').upsert(dbFormat);
      }
    };
    syncOrders();
  }, [orders, loading, initialLoadComplete]);

  useEffect(() => {
    if (!initialLoadComplete) {
      prevArchivedRef.current = archivedOrders;
      return;
    }
    if (JSON.stringify(archivedOrders) === JSON.stringify(prevArchivedRef.current)) return;
    prevArchivedRef.current = archivedOrders;

    const syncArchived = async () => {
      const { data: dbArchived } = await supabase.from('archived_orders').select('id');
      const dbIds = new Set(dbArchived?.map(o => o.id) || []);
      const currentIds = new Set(archivedOrders.map(o => o.id || o.orderId));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('archived_orders').delete().in('id', toDelete);
      }

      if (archivedOrders.length > 0) {
        const dbFormat = archivedOrders.map(o => ({
          id: o.id || o.orderId,
          order_id: o.orderId,
          buyer_name: o.buyerName,
          item: o.item,
          quantity: o.quantity,
          color: o.color,
          extra: o.extra,
          price: o.price,
          address: o.address,
          status: o.status,
          assigned_to: o.assignedTo,
          notes: o.notes,
          store_id: o.storeId,
          shipped_at: o.shippedAt,
          fulfilled_at: o.fulfilledAt,
          created_at: o.createdAt,
          archived_at: o.archivedAt
        }));
        await supabase.from('archived_orders').upsert(dbFormat);
      }
    };
    syncArchived();
  }, [archivedOrders, initialLoadComplete]);

  useEffect(() => {
    if (!initialLoadComplete) {
      prevFilamentsRef.current = filaments;
      return;
    }
    if (JSON.stringify(filaments) === JSON.stringify(prevFilamentsRef.current)) return;
    prevFilamentsRef.current = filaments;

    const syncFilaments = async () => {
      // Flatten filaments object to array for DB
      const allFilaments = [];
      Object.entries(filaments).forEach(([memberId, memberFilaments]) => {
        memberFilaments.forEach(f => {
          allFilaments.push({
            id: f.id,
            member_id: memberId,
            color: f.color,
            color_hex: f.colorHex,
            amount: f.amount,
            rolls: f.rolls
          });
        });
      });

      const { data: dbFilaments } = await supabase.from('filaments').select('id');
      const dbIds = new Set(dbFilaments?.map(f => f.id) || []);
      const currentIds = new Set(allFilaments.map(f => f.id));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('filaments').delete().in('id', toDelete);
      }

      if (allFilaments.length > 0) {
        await supabase.from('filaments').upsert(allFilaments);
      }
    };
    syncFilaments();
  }, [filaments, initialLoadComplete]);

  useEffect(() => {
    if (!initialLoadComplete) {
      prevModelsRef.current = models;
      return;
    }
    if (JSON.stringify(models) === JSON.stringify(prevModelsRef.current)) return;
    prevModelsRef.current = models;

    const syncModels = async () => {
      const { data: dbModels } = await supabase.from('models').select('id');
      const dbIds = new Set(dbModels?.map(m => m.id) || []);
      const currentIds = new Set(models.map(m => m.id));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('models').delete().in('id', toDelete);
      }

      if (models.length > 0) {
        const dbFormat = models.map(m => ({
          id: m.id,
          name: m.name,
          variant_name: m.variantName || '',
          filament_usage: m.filamentUsage,
          default_color: m.defaultColor,
          external_parts: m.externalParts,
          store_id: m.storeId,
          image_url: m.imageUrl
        }));
        await supabase.from('models').upsert(dbFormat);
      }
    };
    syncModels();
  }, [models, initialLoadComplete]);

  useEffect(() => {
    if (!initialLoadComplete) {
      prevStoresRef.current = stores;
      return;
    }
    if (JSON.stringify(stores) === JSON.stringify(prevStoresRef.current)) return;
    prevStoresRef.current = stores;

    const syncStores = async () => {
      const { data: dbStores } = await supabase.from('stores').select('id');
      const dbIds = new Set(dbStores?.map(s => s.id) || []);
      const currentIds = new Set(stores.map(s => s.id));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('stores').delete().in('id', toDelete);
      }

      if (stores.length > 0) {
        await supabase.from('stores').upsert(stores);
      }
    };
    syncStores();
  }, [stores, initialLoadComplete]);

  useEffect(() => {
    if (!initialLoadComplete) {
      prevPartsRef.current = externalParts;
      return;
    }
    if (JSON.stringify(externalParts) === JSON.stringify(prevPartsRef.current)) return;
    prevPartsRef.current = externalParts;

    const syncParts = async () => {
      // Flatten parts object to array
      const allParts = [];
      Object.entries(externalParts).forEach(([memberId, memberParts]) => {
        memberParts.forEach(p => {
          allParts.push({
            id: p.id,
            member_id: memberId,
            name: p.name,
            quantity: p.quantity,
            category_id: p.categoryId,
            reorder_at: p.reorderAt
          });
        });
      });

      const { data: dbParts } = await supabase.from('external_parts').select('id');
      const dbIds = new Set(dbParts?.map(p => p.id) || []);
      const currentIds = new Set(allParts.map(p => p.id));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('external_parts').delete().in('id', toDelete);
      }

      if (allParts.length > 0) {
        await supabase.from('external_parts').upsert(allParts);
      }
    };
    syncParts();
  }, [externalParts, initialLoadComplete]);

  useEffect(() => {
    if (!initialLoadComplete) {
      prevTeamRef.current = teamMembers;
      return;
    }
    if (JSON.stringify(teamMembers) === JSON.stringify(prevTeamRef.current)) return;
    prevTeamRef.current = teamMembers;

    const syncTeam = async () => {
      const { data: dbTeam } = await supabase.from('team_members').select('id');
      const dbIds = new Set(dbTeam?.map(t => t.id) || []);
      const currentIds = new Set(teamMembers.map(t => t.id));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('team_members').delete().in('id', toDelete);
      }

      if (teamMembers.length > 0) {
        await supabase.from('team_members').upsert(teamMembers);
      }
    };
    syncTeam();
  }, [teamMembers, initialLoadComplete]);

  useEffect(() => {
    if (!initialLoadComplete) {
      prevCategoriesRef.current = supplyCategories;
      return;
    }
    if (JSON.stringify(supplyCategories) === JSON.stringify(prevCategoriesRef.current)) return;
    prevCategoriesRef.current = supplyCategories;

    const syncCategories = async () => {
      const { data: dbCategories } = await supabase.from('supply_categories').select('id');
      const dbIds = new Set(dbCategories?.map(c => c.id) || []);
      const currentIds = new Set(supplyCategories.map(c => c.id));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('supply_categories').delete().in('id', toDelete);
      }

      if (supplyCategories.length > 0) {
        await supabase.from('supply_categories').upsert(supplyCategories);
      }
    };
    syncCategories();
  }, [supplyCategories, initialLoadComplete]);

  // Save data functions - using shared storage so all users see the same data
  const saveOrders = async (newOrders) => {
    setOrders(newOrders);
  };

  const saveArchivedOrders = async (newArchived) => {
    setArchivedOrders(newArchived);
  };

  const saveFilaments = async (newFilaments) => {
    setFilaments(newFilaments);
  };

  const saveModels = async (newModels) => {
    setModels(newModels);
  };

  const saveStores = async (newStores) => {
    setStores(newStores);
  };

  const saveExternalParts = async (newParts) => {
    setExternalParts(newParts);
  };

  const saveTeamMembers = async (newTeam) => {
    setTeamMembers(newTeam);
  };

  const saveSupplyCategories = async (newCategories) => {
    setSupplyCategories(newCategories);
  };

  // Clear all stored data
  const clearAllData = async () => {
    if (!confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      return;
    }
    try {
      // Delete all data from Supabase tables
      await Promise.all([
        supabase.from('orders').delete().neq('id', ''),
        supabase.from('archived_orders').delete().neq('id', ''),
        supabase.from('filaments').delete().neq('id', ''),
        supabase.from('models').delete().neq('id', ''),
        supabase.from('external_parts').delete().neq('id', ''),
        supabase.from('supply_categories').delete().neq('id', ''),
        supabase.from('team_members').delete().neq('id', ''),
        supabase.from('stores').delete().neq('id', '')
      ]);

      // Re-insert default data
      await supabase.from('team_members').insert(DEFAULT_TEAM);
      await supabase.from('stores').insert(DEFAULT_STORES);
      await supabase.from('supply_categories').insert(DEFAULT_SUPPLY_CATEGORIES);

      setOrders([]);
      setArchivedOrders([]);
      setFilaments({});
      setModels([]);
      setExternalParts({});
      setSupplyCategories(DEFAULT_SUPPLY_CATEGORIES);
      setTeamMembers(DEFAULT_TEAM);
      setStores(DEFAULT_STORES);
      showNotification('All data cleared successfully');
    } catch (e) {
      console.error('Error clearing data:', e);
      showNotification('Error clearing data', 'error');
    }
  };

  // Auto-archive shipped orders after 2 days
  useEffect(() => {
    const checkArchive = () => {
      const now = Date.now();
      const twoDays = 2 * 24 * 60 * 60 * 1000;
      const toArchive = orders.filter(o => o.status === 'shipped' && o.shippedAt && (now - o.shippedAt) >= twoDays);
      
      if (toArchive.length > 0) {
        const remaining = orders.filter(o => !toArchive.find(a => a.orderId === o.orderId));
        const newArchived = [...archivedOrders, ...toArchive.map(o => ({ ...o, archivedAt: now }))];
        saveOrders(remaining);
        saveArchivedOrders(newArchived);
        showNotification(`${toArchive.length} order(s) auto-archived`);
      }
    };
    
    const interval = setInterval(checkArchive, 60000);
    checkArchive();
    return () => clearInterval(interval);
  }, [orders, archivedOrders]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Auto-assignment algorithm
  const autoAssignOrder = (order, currentOrders) => {
    const model = models.find(m => m.name.toLowerCase() === order.item?.toLowerCase());
    if (!model) return null;

    const scores = teamMembers.map(member => {
      let score = 0;
      
      // Check filament availability
      const memberFilaments = filaments[member.id] || [];
      const orderColor = (order.color || model.defaultColor || '').toLowerCase();
      const neededFilament = memberFilaments.find(f => {
        const filColor = f.color.toLowerCase();
        return filColor === orderColor || 
               filColor.includes(orderColor) || 
               orderColor.includes(filColor);
      });
      if (neededFilament) {
        // Include backup rolls in availability calculation
        const totalAvailable = neededFilament.amount + (neededFilament.rolls || 0) * 1000;
        score += Math.min(totalAvailable / model.filamentUsage, 10) * 3;
      }
      
      // Check external parts availability
      const memberParts = externalParts[member.id] || [];
      let hasAllParts = true;
      (model.externalParts || []).forEach(needed => {
        const part = memberParts.find(p => p.name.toLowerCase() === needed.name.toLowerCase());
        if (!part || part.quantity < needed.quantity) {
          hasAllParts = false;
        } else {
          score += 2;
        }
      });
      
      // Penalize for current workload
      const memberOrders = currentOrders.filter(o => 
        o.assignedTo === member.id && o.status !== 'shipped'
      ).length;
      score -= memberOrders * 2;
      
      return { memberId: member.id, score, hasAllParts };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.memberId || teamMembers[0]?.id;
  };

  // Parse CSV and import orders
  const importCsv = () => {
    try {
      const rawInput = csvInput.trim();
      if (!rawInput) {
        showNotification('No data to import', 'error');
        return;
      }

      const lines = rawInput.split('\n').map(l => l.trim()).filter(l => l);
      
      // Check if first line starts with a 10-digit number (means no header row)
      const firstLineStartsWithTxn = /^\d{10}/.test(lines[0]);
      const hasTab = lines[0]?.includes('\t');
      
      console.log('=== IMPORT DEBUG ===');
      console.log('First line starts with TXN?', firstLineStartsWithTxn);
      console.log('Has tabs?', hasTab);
      
      const newOrders = [];
      let duplicates = 0;

      if (hasTab && firstLineStartsWithTxn) {
        // Tab-separated WITHOUT headers - columns are: TXN, Product, Qty, Variations
        console.log('Format: TAB-separated WITHOUT headers');
        
        for (let i = 0; i < lines.length; i++) {
          const values = lines[i].split('\t').map(v => v.trim());
          
          const transactionId = values[0] || '';
          const product = values[1] || 'Unknown Product';
          const quantity = parseInt(values[2]) || 1;
          const colorField = values[3] || '';
          
          console.log(`Row ${i + 1}:`, { transactionId, product: product.substring(0, 40), quantity, colorField });
          
          if (!transactionId || !/^\d+$/.test(transactionId)) {
            console.log('Skipping invalid transaction ID');
            continue;
          }
          
          if (orders.find(o => o.orderId === transactionId) || archivedOrders.find(o => o.orderId === transactionId)) {
            duplicates++;
            continue;
          }
          
          const { extractedColor, extractedExtra } = parseColorField(colorField);
          
          newOrders.push({
            orderId: transactionId,
            buyerName: 'Unknown',
            item: product,
            quantity: quantity,
            color: extractedColor,
            extra: extractedExtra,
            price: '$0',
            address: '',
            status: 'received',
            assignedTo: null,
            createdAt: Date.now(),
            notes: '',
            storeId: importStoreId && importStoreId !== '' ? importStoreId : null
          });
        }
      } else if (hasTab || lines[0]?.includes(',')) {
        // Traditional CSV/TSV parsing
        const lines = rawInput.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) {
          showNotification('Need header row and at least one data row', 'error');
          return;
        }

        const headerLine = lines[0];
        let delimiter;
        let headers;
        
        if (headerLine.includes('\t')) {
          delimiter = '\t';
          headers = headerLine.split('\t').map(h => h.trim().toLowerCase());
        } else if (headerLine.match(/\s{2,}/)) {
          delimiter = 'spaces';
          headers = headerLine.split(/\s{2,}/).map(h => h.trim().toLowerCase());
        } else {
          delimiter = ',';
          headers = headerLine.split(',').map(h => h.trim().toLowerCase());
        }

        const txnIdx = headers.findIndex(h => h.includes('transaction') || h.includes('order id') || h.includes('sale id'));
        const productIdx = headers.findIndex(h => h.includes('product') || h.includes('item') || h.includes('title'));
        const qtyIdx = headers.findIndex(h => h.includes('quantity') || h.includes('qty'));
        const colorIdx = headers.findIndex(h => h.includes('color') || h.includes('variation'));

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          let values;
          if (delimiter === 'spaces') {
            values = line.split(/\s{2,}/).map(v => v.trim());
          } else {
            values = line.split(delimiter).map(v => v.trim());
          }
          
          const transactionId = txnIdx >= 0 ? values[txnIdx] : `ORD-${Date.now()}-${i}`;
          const product = productIdx >= 0 ? values[productIdx] : 'Unknown Product';
          const quantity = qtyIdx >= 0 ? parseInt(values[qtyIdx]) || 1 : 1;
          const colorField = colorIdx >= 0 ? values[colorIdx] : '';
          
          if (orders.find(o => o.orderId === transactionId) || archivedOrders.find(o => o.orderId === transactionId)) {
            duplicates++;
            continue;
          }
          
          const { extractedColor, extractedExtra } = parseColorField(colorField);
          
          newOrders.push({
            orderId: transactionId,
            buyerName: 'Unknown',
            item: product,
            quantity: quantity,
            color: extractedColor,
            extra: extractedExtra,
            price: '$0',
            address: '',
            status: 'received',
            assignedTo: null,
            createdAt: Date.now(),
            notes: '',
            storeId: importStoreId && importStoreId !== '' ? importStoreId : null
          });
        }
      }

      console.log('=== IMPORT COMPLETE ===');
      console.log('Store ID for import:', importStoreId);
      console.log('New orders:', newOrders.length);
      console.log('First order storeId:', newOrders[0]?.storeId);

      // Auto-assign orders
      const allOrders = [...orders];
      newOrders.forEach(order => {
        order.assignedTo = autoAssignOrder(order, [...allOrders, ...newOrders.filter(o => o !== order)]);
        allOrders.push(order);
      });

      saveOrders([...orders, ...newOrders]);
      
      if (newOrders.length > 0) {
        showNotification(`Imported ${newOrders.length} order${newOrders.length > 1 ? 's' : ''}. ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped.`);
      } else {
        showNotification(`No new orders imported. ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped.`);
      }
      setCsvInput('');
      setCsvPreview(null);
      setShowCsvModal(false);
      setImportStoreId('');
    } catch (e) {
      console.error('Import error:', e);
      showNotification('Error parsing data: ' + e.message, 'error');
    }
  };

  // Update order status
  const updateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map(o => {
      if (o.orderId === orderId) {
        const updates = { status: newStatus };
        if (newStatus === 'shipped') updates.shippedAt = Date.now();
        if (newStatus === 'fulfilled') updates.fulfilledAt = Date.now();
        
        // Deduct inventory when fulfilled
        if (newStatus === 'fulfilled' && o.assignedTo) {
          const model = models.find(m => m.name.toLowerCase() === o.item?.toLowerCase());
          if (model) {
            // Deduct filament
            const ROLL_SIZE = 1000;
            const memberFilaments = [...(filaments[o.assignedTo] || [])];
            const orderColor = (o.color || model.defaultColor || '').toLowerCase();
            const filamentIdx = memberFilaments.findIndex(f => {
              const filColor = f.color.toLowerCase();
              // Match if exact, or if one contains the other
              return filColor === orderColor || 
                     filColor.includes(orderColor) || 
                     orderColor.includes(filColor);
            });
            if (filamentIdx >= 0) {
              let newAmount = memberFilaments[filamentIdx].amount - model.filamentUsage * o.quantity;
              let rolls = memberFilaments[filamentIdx].rolls || 0;
              
              // If amount goes to 0 or below and we have backup rolls, switch to new roll
              if (newAmount <= 0 && rolls > 0) {
                newAmount = ROLL_SIZE + newAmount; // Add remaining to new roll
                rolls -= 1;
                showNotification(`Auto-switched to new roll of ${memberFilaments[filamentIdx].color}! ${rolls} backup roll${rolls !== 1 ? 's' : ''} remaining.`);
              }
              
              memberFilaments[filamentIdx] = {
                ...memberFilaments[filamentIdx],
                amount: Math.max(0, newAmount),
                rolls: rolls
              };
              saveFilaments({ ...filaments, [o.assignedTo]: memberFilaments });
            }
            
            // Deduct external parts
            if (model.externalParts?.length > 0) {
              const memberParts = [...(externalParts[o.assignedTo] || [])];
              model.externalParts.forEach(needed => {
                const partIdx = memberParts.findIndex(p => p.name.toLowerCase() === needed.name.toLowerCase());
                if (partIdx >= 0) {
                  memberParts[partIdx] = {
                    ...memberParts[partIdx],
                    quantity: Math.max(0, memberParts[partIdx].quantity - needed.quantity * o.quantity)
                  };
                }
              });
              saveExternalParts({ ...externalParts, [o.assignedTo]: memberParts });
            }
          }
        }
        
        return { ...o, ...updates };
      }
      return o;
    });
    saveOrders(updated);
  };

  // Reassign order
  const reassignOrder = (orderId, memberId) => {
    const updated = orders.map(o => 
      o.orderId === orderId ? { ...o, assignedTo: memberId } : o
    );
    saveOrders(updated);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading Order Manager...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'queue', label: 'Order Queue', icon: Package },
    { id: 'stores', label: 'Stores', icon: Store },
    { id: 'filament', label: 'Filament', icon: Palette },
    { id: 'models', label: 'Models', icon: Printer },
    { id: 'parts', label: 'Supplies', icon: Box },
    { id: 'restock', label: 'Restock', icon: ShoppingBag },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'team', label: 'Team', icon: Users }
  ];

  return (
    <div className="app-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
          font-family: 'Space Grotesk', sans-serif;
          color: #e0e0e0;
          overflow-x: hidden;
        }
        
        .loading-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0a0a0f;
          color: #00ff88;
        }
        
        .loader {
          width: 50px;
          height: 50px;
          border: 3px solid #1a1a2e;
          border-top-color: #00ff88;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .header {
          background: rgba(10, 10, 15, 0.95);
          border-bottom: 1px solid rgba(0, 255, 136, 0.2);
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0a0a0f;
        }
        
        .logo h1 {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(90deg, #00ff88, #00ccff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
        }
        
        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: #0a0a0f;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .btn-danger {
          background: rgba(255, 71, 87, 0.2);
          color: #ff4757;
          border: 1px solid rgba(255, 71, 87, 0.3);
        }
        
        .btn-danger:hover {
          background: rgba(255, 71, 87, 0.3);
        }
        
        .btn-small {
          padding: 6px 12px;
          font-size: 0.75rem;
        }
        
        .main-content {
          display: flex;
          min-height: calc(100vh - 73px);
        }
        
        .sidebar {
          width: 220px;
          background: rgba(10, 10, 15, 0.8);
          border-right: 1px solid rgba(0, 255, 136, 0.1);
          padding: 1.5rem 1rem;
          backdrop-filter: blur(10px);
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 4px;
          color: #888;
          font-size: 0.9rem;
        }
        
        .nav-item:hover {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
        }
        
        .nav-item.active {
          background: rgba(0, 255, 136, 0.15);
          color: #00ff88;
          border-left: 3px solid #00ff88;
        }
        
        .content-area {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }
        
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .page-title svg {
          color: #00ff88;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.2s ease;
        }
        
        .stat-card:hover {
          border-color: rgba(0, 255, 136, 0.3);
          transform: translateY(-2px);
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          color: #00ff88;
        }
        
        .orders-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }
        
        .order-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        
        .order-card:hover {
          border-color: rgba(0, 255, 136, 0.3);
        }
        
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        
        .order-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: #00ff88;
          margin-bottom: 6px;
          background: rgba(0, 255, 136, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        
        .order-id::before {
          content: 'TXN: ';
          color: #888;
        }
        
        .order-item {
          color: #e0e0e0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .order-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .detail-label {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
        }
        
        .detail-value {
          font-size: 0.9rem;
          color: #e0e0e0;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-received {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        }
        
        .status-fulfilled {
          background: rgba(0, 204, 255, 0.2);
          color: #00ccff;
        }
        
        .status-shipped {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }
        
        .order-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .assign-select {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 8px 12px;
          color: #e0e0e0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          cursor: pointer;
        }
        
        .assign-select:focus {
          outline: none;
          border-color: #00ff88;
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .modal {
          background: #1a1a2e;
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 16px;
          padding: 2rem;
          max-width: 700px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .modal-close {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 4px;
        }
        
        .modal-close:hover {
          color: #ff4757;
        }
        
        .csv-textarea {
          width: 100%;
          height: 300px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 1rem;
          color: #e0e0e0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          resize: vertical;
          margin-bottom: 1rem;
        }
        
        .csv-textarea:focus {
          outline: none;
          border-color: #00ff88;
        }
        
        .csv-help {
          font-size: 0.8rem;
          color: #888;
          margin-bottom: 1rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-label {
          display: block;
          font-size: 0.85rem;
          color: #888;
          margin-bottom: 6px;
        }
        
        .form-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 10px 12px;
          color: #e0e0e0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #00ff88;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        
        .inventory-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
        }
        
        .inventory-card h3 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .inventory-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .inventory-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .inventory-item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .inventory-item-name {
          font-size: 0.95rem;
          font-weight: 500;
        }
        
        .inventory-item-meta {
          font-size: 0.8rem;
          color: #888;
        }
        
        .inventory-item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .qty-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        
        .qty-btn:hover {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }
        
        .qty-value {
          min-width: 50px;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
        }
        
        .color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .add-item-form {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .add-item-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .add-item-input {
          flex: 1;
          min-width: 80px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 10px 12px;
          color: #e0e0e0;
          font-size: 0.9rem;
        }
        
        .add-item-input:focus {
          outline: none;
          border-color: #00ff88;
        }
        
        .model-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }
        
        .model-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        
        .model-name {
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .model-meta {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        
        .model-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #888;
        }
        
        .model-meta-item span {
          color: #00ff88;
          font-family: 'JetBrains Mono', monospace;
        }
        
        .parts-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .part-tag {
          background: rgba(0, 204, 255, 0.2);
          color: #00ccff;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
        }
        
        .notification {
          position: fixed;
          top: 80px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1001;
          animation: slideIn 0.3s ease;
        }
        
        .notification.success {
          background: rgba(0, 255, 136, 0.2);
          border: 1px solid rgba(0, 255, 136, 0.4);
          color: #00ff88;
        }
        
        .notification.error {
          background: rgba(255, 71, 87, 0.2);
          border: 1px solid rgba(255, 71, 87, 0.4);
          color: #ff4757;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #666;
        }
        
        .empty-state svg {
          width: 64px;
          height: 64px;
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        
        .team-member-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .team-member-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .team-member-name {
          font-size: 1.2rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .team-member-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        
        .team-stat {
          text-align: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }
        
        .team-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          color: #00ff88;
        }
        
        .team-stat-label {
          font-size: 0.75rem;
          color: #888;
          text-transform: uppercase;
          margin-top: 4px;
        }
        
        .archive-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .filter-input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 8px 12px;
          color: #e0e0e0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
        }
        
        .filter-input:focus {
          outline: none;
          border-color: #00ff88;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
      `}</style>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      <header className="header">
        <div className="logo">
          <div className="logo-icon">
            <Printer size={24} />
          </div>
          <h1>3D Print Order Manager</h1>
          <span style={{ 
            fontSize: '0.7rem', 
            color: '#00ff88', 
            marginLeft: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: 0.7
          }}>
            <Check size={12} /> Auto-save
          </span>
          {lastRefresh && (
            <span style={{ 
              fontSize: '0.65rem', 
              color: '#888', 
              marginLeft: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Clock size={10} /> Last sync: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => loadData(false)} 
            style={{ marginRight: '8px' }}
            title="Refresh data now"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowCsvModal(true)}>
            <Upload size={18} />
            Import CSV
          </button>
        </div>
      </header>

      <div className="main-content">
        <nav className="sidebar">
          {tabs.map(tab => {
            // Calculate restock count for badge (supplies + filaments)
            let restockCount = 0;
            if (tab.id === 'restock') {
              // Count supplies needing restock
              teamMembers.forEach(member => {
                const memberParts = externalParts[member.id] || [];
                memberParts.forEach(part => {
                  if (part.reorderAt && part.quantity <= part.reorderAt) {
                    restockCount++;
                  }
                });
              });
              // Count filaments needing restock (<=250g and 0 rolls)
              teamMembers.forEach(member => {
                const memberFilaments = filaments[member.id] || [];
                memberFilaments.forEach(fil => {
                  if (fil.amount <= 250 && (fil.rolls || 0) === 0) {
                    restockCount++;
                  }
                });
              });
            }
            
            return (
            <div
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              {tab.label}
              {tab.id === 'restock' && restockCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#ffc107',
                  color: '#000',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {restockCount}
                </span>
              )}
            </div>
          );})}
        </nav>

        <main className="content-area">
          {activeTab === 'queue' && (
            <QueueTab
              orders={orders}
              teamMembers={teamMembers}
              stores={stores}
              models={models}
              selectedStoreFilter={selectedStoreFilter}
              setSelectedStoreFilter={setSelectedStoreFilter}
              updateOrderStatus={updateOrderStatus}
              reassignOrder={reassignOrder}
            />
          )}
          
          {activeTab === 'stores' && (
            <StoresTab
              stores={stores}
              saveStores={saveStores}
              orders={orders}
              archivedOrders={archivedOrders}
              showNotification={showNotification}
            />
          )}
          
          {activeTab === 'filament' && (
            <FilamentTab
              filaments={filaments}
              teamMembers={teamMembers}
              saveFilaments={saveFilaments}
              showNotification={showNotification}
            />
          )}
          
          {activeTab === 'models' && (
            <ModelsTab
              models={models}
              stores={stores}
              saveModels={saveModels}
              showNotification={showNotification}
            />
          )}
          
          {activeTab === 'parts' && (
            <PartsTab
              externalParts={externalParts}
              supplyCategories={supplyCategories}
              teamMembers={teamMembers}
              saveExternalParts={saveExternalParts}
              saveSupplyCategories={saveSupplyCategories}
              showNotification={showNotification}
            />
          )}
          
          {activeTab === 'restock' && (
            <RestockTab
              externalParts={externalParts}
              supplyCategories={supplyCategories}
              teamMembers={teamMembers}
              filaments={filaments}
            />
          )}
          
          {activeTab === 'archive' && (
            <ArchiveTab
              archivedOrders={archivedOrders}
              teamMembers={teamMembers}
              models={models}
            />
          )}
          
          {activeTab === 'team' && (
            <TeamTab
              teamMembers={teamMembers}
              saveTeamMembers={saveTeamMembers}
              orders={orders}
              filaments={filaments}
              externalParts={externalParts}
              showNotification={showNotification}
            />
          )}
        </main>
      </div>

      {showCsvModal && (
        <div className="modal-overlay" onClick={() => { setShowCsvModal(false); setCsvPreview(null); setCsvInput(''); setImportStoreId(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Import Etsy CSV</h2>
              <button className="modal-close" onClick={() => { setShowCsvModal(false); setCsvPreview(null); setCsvInput(''); setImportStoreId(''); }}>
                <X size={24} />
              </button>
            </div>
            <p className="csv-help">
              Paste your Etsy order data below. Supports both tab-separated format with headers, 
              or concatenated format (Transaction ID followed directly by product data).
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '0.9rem' }}>
                <Store size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Import to Store:
              </label>
              <select
                className="assign-select"
                style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
                value={importStoreId}
                onChange={e => setImportStoreId(e.target.value)}
              >
                <option value="">-- Select Store --</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <textarea
              className="csv-textarea"
              value={csvInput}
              onChange={e => previewCsv(e.target.value)}
              placeholder="Paste CSV data here..."
            />
            {csvPreview && (
              <div style={{ background: 'rgba(0,255,136,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><strong>Format:</strong> {csvPreview.format || 'AUTO'}</span>
                  <span style={{ background: 'rgba(0,255,136,0.3)', padding: '6px 14px', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem' }}>
                    {csvPreview.rowCount} order{csvPreview.rowCount !== 1 ? 's' : ''} to import
                  </span>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ marginBottom: '6px', color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>First Order Preview</div>
                  {csvPreview.transactionId && (
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#888' }}>TXN: </span>
                      <span style={{ color: '#00ccff', fontFamily: 'JetBrains Mono, monospace' }}>{csvPreview.transactionId}</span>
                    </div>
                  )}
                  {csvPreview.extractedProduct && (
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#888' }}>Product: </span>
                      <span style={{ color: '#00ff88' }}>{csvPreview.extractedProduct.substring(0, 60)}{csvPreview.extractedProduct.length > 60 ? '...' : ''}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ color: '#888' }}>Qty: </span>
                      <span style={{ color: '#fff' }}>{csvPreview.extractedQuantity || 1}</span>
                    </div>
                    <div>
                      <span style={{ color: '#888' }}>Color: </span>
                      <span style={{ color: csvPreview.extractedColor ? '#00ff88' : '#ff4757' }}>
                        {csvPreview.extractedColor || 'not detected'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#888' }}>Extra: </span>
                      <span style={{ color: csvPreview.extractedExtra ? '#00ff88' : '#888' }}>
                        {csvPreview.extractedExtra || 'none'}
                      </span>
                    </div>
                  </div>
                  {csvPreview.colorField && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#666' }}>
                      Raw variations: {csvPreview.colorField.substring(0, 80)}{csvPreview.colorField.length > 80 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowCsvModal(false); setCsvPreview(null); setCsvInput(''); setImportStoreId(''); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={importCsv} disabled={!csvPreview}>
                <Upload size={18} />
                {csvPreview ? `Import ${csvPreview.rowCount} Order${csvPreview.rowCount !== 1 ? 's' : ''}` : 'Import Orders'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Queue Tab Component
function QueueTab({ orders, teamMembers, stores, models, selectedStoreFilter, setSelectedStoreFilter, updateOrderStatus, reassignOrder }) {
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('all');
  
  console.log('=== QUEUE TAB DEBUG ===');
  console.log('Total orders:', orders?.length);
  console.log('Selected store filter:', selectedStoreFilter);
  console.log('Selected partner filter:', selectedPartnerFilter);
  
  // Filter orders by selected store
  let filteredOrders = selectedStoreFilter === 'all' 
    ? orders 
    : orders.filter(o => o.storeId === selectedStoreFilter);
  
  // Filter by partner
  if (selectedPartnerFilter === 'unassigned') {
    filteredOrders = filteredOrders.filter(o => !o.assignedTo);
  } else if (selectedPartnerFilter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.assignedTo === selectedPartnerFilter);
  }
  
  console.log('Filtered orders:', filteredOrders?.length);
  
  const activeOrders = filteredOrders.filter(o => o.status !== 'shipped');
  const receivedCount = filteredOrders.filter(o => o.status === 'received').length;
  const fulfilledCount = filteredOrders.filter(o => o.status === 'fulfilled').length;
  const shippedCount = filteredOrders.filter(o => o.status === 'shipped').length;

  // Get store name helper
  const getStoreName = (storeId) => {
    const store = stores?.find(s => s.id === storeId);
    return store ? store.name : 'No Store';
  };

  const getStoreColor = (storeId) => {
    const store = stores?.find(s => s.id === storeId);
    return store?.color || '#888';
  };

  return (
    <>
      <h2 className="page-title"><Package size={28} /> Order Queue</h2>
      
      {/* Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {/* Store Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Store size={20} style={{ color: '#00ff88' }} />
          <span style={{ color: '#888' }}>Store:</span>
          <select
            className="assign-select"
            style={{ minWidth: '150px' }}
            value={selectedStoreFilter}
            onChange={e => setSelectedStoreFilter(e.target.value)}
        >
          <option value="all">All Stores</option>
          {stores?.map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
        </div>
        
        {/* Partner Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={20} style={{ color: '#00ccff' }} />
          <span style={{ color: '#888' }}>Partner:</span>
          <select
            className="assign-select"
            style={{ minWidth: '150px' }}
            value={selectedPartnerFilter}
            onChange={e => setSelectedPartnerFilter(e.target.value)}
          >
            <option value="all">All Partners</option>
            <option value="unassigned">Unassigned</option>
            {teamMembers?.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Received</div>
          <div className="stat-value">{receivedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fulfilled</div>
          <div className="stat-value">{fulfilledCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Shipped</div>
          <div className="stat-value">{shippedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Active</div>
          <div className="stat-value">{activeOrders.length}</div>
        </div>
      </div>

      {/* When a specific partner or unassigned is selected, show filtered grid */}
      {selectedPartnerFilter !== 'all' ? (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedPartnerFilter === 'unassigned' ? (
              <>
                <AlertCircle size={20} style={{ color: '#ffc107' }} />
                Unassigned Orders ({activeOrders.length})
              </>
            ) : (
              <>
                <Users size={20} style={{ color: '#00ff88' }} />
                {teamMembers.find(m => m.id === selectedPartnerFilter)?.name}'s Orders ({activeOrders.length})
              </>
            )}
          </h3>
          <div className="orders-list">
            {activeOrders.length === 0 ? (
              <div className="empty-state">
                <Package />
                <p>No orders found</p>
              </div>
            ) : (
              activeOrders.map(order => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  teamMembers={teamMembers}
                  stores={stores}
                  models={models}
                  updateOrderStatus={updateOrderStatus}
                  reassignOrder={reassignOrder}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* Show all orders in a single grid when "All Partners" is selected */
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} style={{ color: '#00ff88' }} />
            All Orders ({activeOrders.length})
          </h3>
          <div className="orders-list">
            {activeOrders.length === 0 ? (
              <div className="empty-state">
                <Package />
                <p>No orders yet</p>
              </div>
            ) : (
              activeOrders.map(order => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  teamMembers={teamMembers}
                  stores={stores}
                  models={models}
                  updateOrderStatus={updateOrderStatus}
                  reassignOrder={reassignOrder}
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Order Card Component
function OrderCard({ order, teamMembers, stores, models, updateOrderStatus, reassignOrder }) {
  const statusIcons = {
    received: <Clock size={14} />,
    fulfilled: <Check size={14} />,
    shipped: <Truck size={14} />
  };

  const store = stores?.find(s => s.id === order.storeId);
  const assignedMember = teamMembers?.find(m => m.id === order.assignedTo);
  
  // Find matching model by name (case-insensitive, partial match)
  const matchingModel = models?.find(m => {
    const modelName = m.name.toLowerCase();
    const orderItem = (order.item || '').toLowerCase();
    return orderItem.includes(modelName) || modelName.includes(orderItem);
  });

  return (
    <div className="order-card">
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Model Image */}
        {matchingModel?.imageUrl ? (
          <div style={{ flexShrink: 0 }}>
            <img 
              src={matchingModel.imageUrl} 
              alt={matchingModel.name}
              style={{
                width: '70px',
                height: '70px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />
          </div>
        ) : (
          <div style={{ 
            flexShrink: 0,
            width: '70px',
            height: '70px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Image size={24} style={{ color: '#444' }} />
          </div>
        )}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="order-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <div className="order-id">{order.orderId}</div>
                {store && (
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '2px 6px', 
                    borderRadius: '8px', 
                    backgroundColor: store.color + '20',
                    color: store.color,
                    border: `1px solid ${store.color}40`
                  }}>
                    {store.name}
                  </span>
                )}
              </div>
              <div className="order-item" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>{order.item}</div>
            </div>
            <span className={`status-badge status-${order.status}`}>
              {statusIcons[order.status]}
              {order.status}
            </span>
          </div>
        </div>
      </div>
      
      {/* Assigned Partner Badge */}
      <div style={{ marginBottom: '12px', marginTop: '12px' }}>
        {assignedMember ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 204, 255, 0.15)',
            color: '#00ccff',
            border: '1px solid rgba(0, 204, 255, 0.3)'
          }}>
            <Users size={12} />
            {assignedMember.name}
          </span>
        ) : (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 193, 7, 0.15)',
            color: '#ffc107',
            border: '1px solid rgba(255, 193, 7, 0.3)'
          }}>
            <AlertCircle size={12} />
            Unassigned
          </span>
        )}
      </div>
      
      <div className="order-details">
        <div className="detail-item">
          <span className="detail-label">Quantity</span>
          <span className="detail-value">{order.quantity}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Color</span>
          <span className="detail-value">{order.color || 'Not specified'}</span>
        </div>
        {order.extra && (
          <div className="detail-item">
            <span className="detail-label">Extra</span>
            <span className="detail-value">{order.extra}</span>
          </div>
        )}
      </div>

      <div className="order-actions" style={{ marginTop: 'auto' }}>
        <select
          className="assign-select"
          value={order.assignedTo || ''}
          onChange={e => reassignOrder(order.orderId, e.target.value)}
        >
          <option value="">Unassigned</option>
          {teamMembers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        
        {order.status === 'received' && (
          <button
            className="btn btn-secondary btn-small"
            onClick={() => updateOrderStatus(order.orderId, 'fulfilled')}
          >
            <Check size={16} /> Mark Fulfilled
          </button>
        )}
        {order.status === 'fulfilled' && (
          <button
            className="btn btn-primary btn-small"
            onClick={() => updateOrderStatus(order.orderId, 'shipped')}
          >
            <Truck size={16} /> Mark Shipped
          </button>
        )}
        {order.status === 'shipped' && (
          <span style={{ fontSize: '0.8rem', color: '#888' }}>
            Will auto-archive in 2 days
          </span>
        )}
      </div>
    </div>
  );
}

// Stores Tab Component
function StoresTab({ stores, saveStores, orders, archivedOrders, showNotification }) {
  const [newStore, setNewStore] = useState({ name: '', color: '#00ff88' });
  const [editingStore, setEditingStore] = useState(null);
  const [expandedStore, setExpandedStore] = useState(null);

  // Combine active and archived orders for analytics
  const allOrders = [...orders, ...(archivedOrders || [])];

  const addStore = () => {
    if (!newStore.name.trim()) {
      showNotification('Please enter a store name', 'error');
      return;
    }
    
    const store = {
      id: `store-${Date.now()}`,
      name: newStore.name.trim(),
      color: newStore.color
    };
    
    saveStores([...stores, store]);
    setNewStore({ name: '', color: '#00ff88' });
    showNotification('Store added successfully');
  };

  const updateStore = (storeId) => {
    if (!editingStore?.name?.trim()) {
      showNotification('Store name cannot be empty', 'error');
      return;
    }
    
    const updated = stores.map(s => 
      s.id === storeId ? { ...s, name: editingStore.name, color: editingStore.color } : s
    );
    saveStores(updated);
    setEditingStore(null);
    showNotification('Store updated');
  };

  const deleteStore = (storeId) => {
    const orderCount = orders.filter(o => o.storeId === storeId).length;
    if (orderCount > 0) {
      showNotification(`Cannot delete store with ${orderCount} order(s). Reassign orders first.`, 'error');
      return;
    }
    
    const updated = stores.filter(s => s.id !== storeId);
    saveStores(updated);
    showNotification('Store deleted');
  };

  const getOrderCount = (storeId) => {
    return orders.filter(o => o.storeId === storeId).length;
  };

  // Get analytics for a specific store
  const getStoreAnalytics = (storeId) => {
    const storeOrders = allOrders.filter(o => o.storeId === storeId);
    
    // Count colors
    const colorCounts = {};
    storeOrders.forEach(order => {
      const color = order.color || 'Not specified';
      colorCounts[color] = (colorCounts[color] || 0) + (order.quantity || 1);
    });
    
    // Count products/models
    const productCounts = {};
    storeOrders.forEach(order => {
      const product = order.item || 'Unknown';
      // Truncate long product names for display
      const shortName = product.length > 50 ? product.substring(0, 50) + '...' : product;
      productCounts[shortName] = (productCounts[shortName] || 0) + (order.quantity || 1);
    });
    
    // Sort and get top 5
    const topColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Calculate total revenue (orders count)
    const totalOrders = storeOrders.length;
    const totalItems = storeOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
    
    return { topColors, topProducts, totalOrders, totalItems };
  };

  return (
    <>
      <h2 className="page-title"><Store size={28} /> Etsy Stores</h2>
      
      <div className="inventory-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} style={{ color: '#00ff88' }} />
          Add New Store
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Store Name</label>
            <input
              type="text"
              className="add-item-input"
              style={{ width: '100%' }}
              placeholder="e.g., My Etsy Shop"
              value={newStore.name}
              onChange={e => setNewStore({ ...newStore, name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Color</label>
            <input
              type="color"
              value={newStore.color}
              onChange={e => setNewStore({ ...newStore, color: e.target.value })}
              style={{ width: '50px', height: '38px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            />
          </div>
          <button className="btn btn-primary" onClick={addStore}>
            <Plus size={18} /> Add Store
          </button>
        </div>
      </div>
      
      <div className="inventory-grid">
        {stores.map(store => {
          const analytics = getStoreAnalytics(store.id);
          const isExpanded = expandedStore === store.id;
          
          return (
          <div key={store.id} className="inventory-card" style={{ gridColumn: isExpanded ? '1 / -1' : 'auto' }}>
            {editingStore?.id === store.id ? (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="add-item-input"
                    style={{ width: '100%', marginBottom: '10px' }}
                    value={editingStore.name}
                    onChange={e => setEditingStore({ ...editingStore, name: e.target.value })}
                  />
                  <input
                    type="color"
                    value={editingStore.color}
                    onChange={e => setEditingStore({ ...editingStore, color: e.target.value })}
                    style={{ width: '50px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-small" onClick={() => updateStore(store.id)}>
                    <Save size={16} /> Save
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={() => setEditingStore(null)}>
                    <X size={16} /> Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        backgroundColor: store.color,
                        flexShrink: 0
                      }} 
                    />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{store.name}</h3>
                  </div>
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => setExpandedStore(isExpanded ? null : store.id)}
                    style={{ padding: '6px 10px' }}
                  >
                    <BarChart3 size={16} />
                    {isExpanded ? ' Hide' : ' Analytics'}
                  </button>
                </div>
                
                {/* Quick Stats */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ color: '#888' }}>
                    <ShoppingBag size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    <span style={{ color: '#fff' }}>{getOrderCount(store.id)}</span> active
                  </div>
                  <div style={{ color: '#888' }}>
                    <Package size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    <span style={{ color: '#fff' }}>{analytics.totalOrders}</span> total orders
                  </div>
                  <div style={{ color: '#888' }}>
                    <Box size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    <span style={{ color: '#fff' }}>{analytics.totalItems}</span> items sold
                  </div>
                </div>
                
                {/* Expanded Analytics */}
                {isExpanded && analytics.totalOrders > 0 && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                    gap: '20px',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {/* Top Colors */}
                    <div style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '16px', 
                      borderRadius: '12px' 
                    }}>
                      <h4 style={{ 
                        margin: '0 0 12px 0', 
                        fontSize: '0.9rem', 
                        color: '#00ff88',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Palette size={18} />
                        Top Selling Colors
                      </h4>
                      {analytics.topColors.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '0.85rem' }}>No color data yet</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {analytics.topColors.map(([color, count], idx) => {
                            const maxCount = analytics.topColors[0][1];
                            const percentage = (count / maxCount) * 100;
                            return (
                              <div key={color} style={{ position: 'relative' }}>
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  height: '100%',
                                  width: `${percentage}%`,
                                  background: `linear-gradient(90deg, ${store.color}40 0%, ${store.color}10 100%)`,
                                  borderRadius: '6px',
                                  zIndex: 0
                                }} />
                                <div style={{
                                  position: 'relative',
                                  zIndex: 1,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 12px'
                                }}>
                                  <span style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    fontSize: '0.9rem'
                                  }}>
                                    <span style={{ 
                                      color: '#888', 
                                      fontSize: '0.75rem',
                                      width: '18px'
                                    }}>#{idx + 1}</span>
                                    {color}
                                  </span>
                                  <span style={{ 
                                    fontWeight: 600, 
                                    color: store.color,
                                    fontSize: '0.9rem'
                                  }}>{count}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Top Products */}
                    <div style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '16px', 
                      borderRadius: '12px' 
                    }}>
                      <h4 style={{ 
                        margin: '0 0 12px 0', 
                        fontSize: '0.9rem', 
                        color: '#00ccff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Printer size={18} />
                        Top Selling Products
                      </h4>
                      {analytics.topProducts.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '0.85rem' }}>No product data yet</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {analytics.topProducts.map(([product, count], idx) => {
                            const maxCount = analytics.topProducts[0][1];
                            const percentage = (count / maxCount) * 100;
                            return (
                              <div key={product} style={{ position: 'relative' }}>
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  height: '100%',
                                  width: `${percentage}%`,
                                  background: `linear-gradient(90deg, #00ccff40 0%, #00ccff10 100%)`,
                                  borderRadius: '6px',
                                  zIndex: 0
                                }} />
                                <div style={{
                                  position: 'relative',
                                  zIndex: 1,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 12px'
                                }}>
                                  <span style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    fontSize: '0.85rem',
                                    flex: 1,
                                    minWidth: 0
                                  }}>
                                    <span style={{ 
                                      color: '#888', 
                                      fontSize: '0.75rem',
                                      width: '18px',
                                      flexShrink: 0
                                    }}>#{idx + 1}</span>
                                    <span style={{ 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap' 
                                    }}>{product}</span>
                                  </span>
                                  <span style={{ 
                                    fontWeight: 600, 
                                    color: '#00ccff',
                                    fontSize: '0.9rem',
                                    marginLeft: '8px',
                                    flexShrink: 0
                                  }}>{count}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {isExpanded && analytics.totalOrders === 0 && (
                  <div style={{ 
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    <BarChart3 size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>No order data yet for this store</p>
                    <p style={{ fontSize: '0.85rem' }}>Import orders to see analytics</p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: isExpanded ? '16px' : '0' }}>
                  <button 
                    className="btn btn-secondary btn-small" 
                    onClick={() => setEditingStore({ id: store.id, name: store.name, color: store.color })}
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button 
                    className="btn btn-secondary btn-small" 
                    onClick={() => deleteStore(store.id)}
                    style={{ color: '#ff4757' }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        );})}
        
        {stores.length === 0 && (
          <div className="empty-state">
            <Store size={48} />
            <p>No stores added yet</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Add your Etsy stores to organize orders</p>
          </div>
        )}
      </div>
    </>
  );
}

// Filament Tab Component
function FilamentTab({ filaments, teamMembers, saveFilaments, showNotification }) {
  const [newFilament, setNewFilament] = useState({ color: '', amount: '', colorHex: '#ffffff', rolls: '0' });
  const [editingFilament, setEditingFilament] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const ROLL_SIZE = 1000; // grams per roll
  const REORDER_THRESHOLD = 250; // grams - show reorder alert when at or below this with 0 rolls

  const needsRestock = (fil) => {
    return fil.amount <= REORDER_THRESHOLD && (fil.rolls || 0) === 0;
  };

  const addFilament = (memberId) => {
    if (!newFilament.color || !newFilament.amount) {
      showNotification('Please enter color and amount', 'error');
      return;
    }
    
    const memberFilaments = [...(filaments[memberId] || [])];
    const existing = memberFilaments.findIndex(f => 
      f.color.toLowerCase() === newFilament.color.toLowerCase()
    );
    
    if (existing >= 0) {
      memberFilaments[existing].amount += parseFloat(newFilament.amount);
      memberFilaments[existing].rolls = (memberFilaments[existing].rolls || 0) + parseInt(newFilament.rolls || 0);
    } else {
      memberFilaments.push({
        id: Date.now().toString(),
        color: newFilament.color,
        colorHex: newFilament.colorHex,
        amount: parseFloat(newFilament.amount),
        rolls: parseInt(newFilament.rolls || 0)
      });
    }
    
    saveFilaments({ ...filaments, [memberId]: memberFilaments });
    setNewFilament({ color: '', amount: '', colorHex: '#ffffff', rolls: '0' });
    showNotification('Filament added successfully');
  };

  const updateAmount = (memberId, filamentId, delta) => {
    const memberFilaments = [...(filaments[memberId] || [])];
    const idx = memberFilaments.findIndex(f => f.id === filamentId);
    if (idx >= 0) {
      let newAmount = memberFilaments[idx].amount + delta;
      let rolls = memberFilaments[idx].rolls || 0;
      
      // If amount goes to 0 or below and we have backup rolls, switch to new roll
      if (newAmount <= 0 && rolls > 0) {
        newAmount = ROLL_SIZE + newAmount; // Add remaining to new roll (newAmount is negative or 0)
        rolls -= 1;
        showNotification(`Switched to new roll of ${memberFilaments[idx].color}! ${rolls} backup roll${rolls !== 1 ? 's' : ''} remaining.`);
      }
      
      memberFilaments[idx] = {
        ...memberFilaments[idx],
        amount: Math.max(0, newAmount),
        rolls: rolls
      };
      saveFilaments({ ...filaments, [memberId]: memberFilaments });
    }
  };

  const addRoll = (memberId, filamentId) => {
    const memberFilaments = [...(filaments[memberId] || [])];
    const idx = memberFilaments.findIndex(f => f.id === filamentId);
    if (idx >= 0) {
      memberFilaments[idx] = {
        ...memberFilaments[idx],
        rolls: (memberFilaments[idx].rolls || 0) + 1
      };
      saveFilaments({ ...filaments, [memberId]: memberFilaments });
      showNotification('Added 1 backup roll');
    }
  };

  const removeRoll = (memberId, filamentId) => {
    const memberFilaments = [...(filaments[memberId] || [])];
    const idx = memberFilaments.findIndex(f => f.id === filamentId);
    if (idx >= 0 && (memberFilaments[idx].rolls || 0) > 0) {
      memberFilaments[idx] = {
        ...memberFilaments[idx],
        rolls: memberFilaments[idx].rolls - 1
      };
      saveFilaments({ ...filaments, [memberId]: memberFilaments });
      showNotification('Removed 1 backup roll');
    }
  };

  const removeFilament = (memberId, filamentId) => {
    const memberFilaments = (filaments[memberId] || []).filter(f => f.id !== filamentId);
    saveFilaments({ ...filaments, [memberId]: memberFilaments });
    showNotification('Filament removed');
  };

  const startEdit = (memberId, filament) => {
    setEditingMemberId(memberId);
    setEditingFilament({ ...filament });
  };

  const saveEdit = () => {
    if (!editingFilament.color) {
      showNotification('Please enter a color name', 'error');
      return;
    }
    const memberFilaments = [...(filaments[editingMemberId] || [])];
    const idx = memberFilaments.findIndex(f => f.id === editingFilament.id);
    if (idx >= 0) {
      memberFilaments[idx] = {
        ...editingFilament,
        amount: parseFloat(editingFilament.amount) || 0,
        rolls: parseInt(editingFilament.rolls) || 0
      };
      saveFilaments({ ...filaments, [editingMemberId]: memberFilaments });
      showNotification('Filament updated');
    }
    setEditingFilament(null);
    setEditingMemberId(null);
  };

  return (
    <>
      <h2 className="page-title"><Palette size={28} /> Filament Inventory</h2>
      
      <div className="inventory-grid">
        {teamMembers.map(member => (
          <div key={member.id} className="inventory-card">
            <h3><Palette size={20} style={{ color: '#00ff88' }} /> {member.name}</h3>
            
            <div className="inventory-items">
              {(filaments[member.id] || []).length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>No filament added</p>
              ) : (
                (filaments[member.id] || []).map(fil => {
                  const lowStock = needsRestock(fil);
                  return (
                  <div key={fil.id} className="inventory-item" style={lowStock ? {
                    borderColor: 'rgba(255, 193, 7, 0.5)',
                    background: 'rgba(255, 193, 7, 0.1)'
                  } : {}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <div className="inventory-item-info">
                        <div className="inventory-item-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="color-dot" style={{ backgroundColor: fil.colorHex }} />
                          {fil.color}
                          {lowStock && (
                            <span style={{ 
                              fontSize: '0.65rem', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              background: 'rgba(255, 193, 7, 0.2)',
                              color: '#ffc107',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <AlertCircle size={10} /> Low Stock
                            </span>
                          )}
                        </div>
                        <div className="inventory-item-meta">
                          {fil.amount.toFixed(0)}g remaining
                          {(fil.rolls || 0) > 0 && (
                            <span style={{ color: '#00ccff', marginLeft: '8px' }}>
                              + {fil.rolls} backup roll{fil.rolls !== 1 ? 's' : ''} ({fil.rolls * ROLL_SIZE}g)
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="qty-btn" onClick={() => startEdit(member.id, fil)} title="Edit filament">
                          <Edit2 size={14} />
                        </button>
                        <button className="qty-btn" onClick={() => removeFilament(member.id, fil.id)} title="Remove filament">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="inventory-item-controls" style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#888', minWidth: '55px' }}>Amount:</span>
                        <button className="qty-btn" onClick={() => updateAmount(member.id, fil.id, -50)}>
                          <Minus size={14} />
                        </button>
                        <span className="qty-value" style={{ minWidth: '60px', textAlign: 'center' }}>{fil.amount.toFixed(0)}g</span>
                        <button className="qty-btn" onClick={() => updateAmount(member.id, fil.id, 50)}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#888', minWidth: '40px' }}>Rolls:</span>
                        <button className="qty-btn" onClick={() => removeRoll(member.id, fil.id)} disabled={(fil.rolls || 0) === 0}>
                          <Minus size={14} />
                        </button>
                        <span className="qty-value" style={{ minWidth: '30px', textAlign: 'center' }}>{fil.rolls || 0}</span>
                        <button className="qty-btn" onClick={() => addRoll(member.id, fil.id)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );})
              )}
            </div>

            <div className="add-item-form">
              <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="Color name (e.g., Sage Green)"
                  value={newFilament.color}
                  onChange={e => setNewFilament({ ...newFilament, color: e.target.value })}
                  style={{ flex: 1, padding: '10px 12px', fontSize: '0.95rem' }}
                />
                <input
                  type="color"
                  value={newFilament.colorHex}
                  onChange={e => setNewFilament({ ...newFilament, colorHex: e.target.value })}
                  style={{ width: '50px', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}
                  title="Pick color"
                />
              </div>
              <div className="add-item-row">
                <input
                  type="number"
                  className="add-item-input"
                  placeholder="Amount (g)"
                  value={newFilament.amount}
                  onChange={e => setNewFilament({ ...newFilament, amount: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="add-item-input"
                  placeholder="Backup rolls"
                  value={newFilament.rolls}
                  onChange={e => setNewFilament({ ...newFilament, rolls: e.target.value })}
                  style={{ flex: 1 }}
                  min="0"
                />
                <button className="btn btn-primary btn-small" onClick={() => addFilament(member.id)}>
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Filament Modal */}
      {editingFilament && (
        <div className="modal-overlay" onClick={() => { setEditingFilament(null); setEditingMemberId(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Filament</h2>
              <button className="modal-close" onClick={() => { setEditingFilament(null); setEditingMemberId(null); }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Color Name</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  value={editingFilament.color}
                  onChange={e => setEditingFilament({ ...editingFilament, color: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  type="color"
                  value={editingFilament.colorHex || '#ffffff'}
                  onChange={e => setEditingFilament({ ...editingFilament, colorHex: e.target.value })}
                  style={{ width: '50px', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Current Amount (grams)</label>
              <input
                type="number"
                className="form-input"
                value={editingFilament.amount}
                onChange={e => setEditingFilament({ ...editingFilament, amount: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Backup Rolls (1000g each)</label>
              <input
                type="number"
                className="form-input"
                value={editingFilament.rolls || 0}
                onChange={e => setEditingFilament({ ...editingFilament, rolls: e.target.value })}
                min="0"
              />
            </div>

            <div style={{ 
              padding: '12px', 
              background: 'rgba(255, 193, 7, 0.1)', 
              borderRadius: '8px', 
              marginBottom: '16px',
              fontSize: '0.85rem',
              color: '#888'
            }}>
              <strong style={{ color: '#ffc107' }}>Restock Alert:</strong> Filament will appear on the Restock page when amount falls to 250g or below with 0 backup rolls.
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setEditingFilament(null); setEditingMemberId(null); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEdit}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Models Tab Component
function ModelsTab({ models, stores, saveModels, showNotification }) {
  const [showAddModel, setShowAddModel] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [newModel, setNewModel] = useState({
    name: '',
    variantName: '',
    filamentUsage: '',
    defaultColor: '',
    externalParts: [],
    storeId: '',
    imageUrl: ''
  });
  const [newPart, setNewPart] = useState({ name: '', quantity: 1 });

  const getStoreName = (storeId) => {
    const store = stores?.find(s => s.id === storeId);
    return store ? store.name : 'All Stores';
  };

  const getStoreColor = (storeId) => {
    const store = stores?.find(s => s.id === storeId);
    return store?.color || '#888';
  };

  // Convert file to base64
  const handleImageUpload = (e, isEditing) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 500000) { // 500KB limit
      showNotification('Image too large. Please use an image under 500KB.', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEditing) {
        setEditingModel({ ...editingModel, imageUrl: reader.result });
      } else {
        setNewModel({ ...newModel, imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const addModel = () => {
    if (!newModel.name || !newModel.filamentUsage) {
      showNotification('Please enter model name and filament usage', 'error');
      return;
    }

    const model = {
      id: Date.now().toString(),
      name: newModel.name,
      variantName: newModel.variantName || '',
      filamentUsage: parseFloat(newModel.filamentUsage),
      defaultColor: newModel.defaultColor,
      externalParts: newModel.externalParts,
      storeId: newModel.storeId || null,
      imageUrl: newModel.imageUrl || ''
    };

    saveModels([...models, model]);
    setNewModel({ name: '', variantName: '', filamentUsage: '', defaultColor: '', externalParts: [], storeId: '', imageUrl: '' });
    setShowAddModel(false);
    showNotification('Model added successfully');
  };

  const updateModel = () => {
    const updated = models.map(m => m.id === editingModel.id ? editingModel : m);
    saveModels(updated);
    setEditingModel(null);
    showNotification('Model updated');
  };

  const deleteModel = (id) => {
    saveModels(models.filter(m => m.id !== id));
    showNotification('Model deleted');
  };

  const duplicateModel = (model) => {
    const newModel = {
      ...model,
      id: Date.now().toString(),
      name: model.name,
      variantName: `${model.variantName || ''} (Copy)`.trim(),
      externalParts: [...(model.externalParts || [])]
    };
    saveModels([...models, newModel]);
    showNotification('Model duplicated - click Edit to set variant name');
  };

  const addPartToModel = (isEditing) => {
    if (!newPart.name) return;
    
    if (isEditing) {
      setEditingModel({
        ...editingModel,
        externalParts: [...(editingModel.externalParts || []), { ...newPart }]
      });
    } else {
      setNewModel({
        ...newModel,
        externalParts: [...newModel.externalParts, { ...newPart }]
      });
    }
    setNewPart({ name: '', quantity: 1 });
  };

  const removePartFromModel = (partIdx, isEditing) => {
    if (isEditing) {
      setEditingModel({
        ...editingModel,
        externalParts: editingModel.externalParts.filter((_, i) => i !== partIdx)
      });
    } else {
      setNewModel({
        ...newModel,
        externalParts: newModel.externalParts.filter((_, i) => i !== partIdx)
      });
    }
  };

  return (
    <>
      <div className="section-header">
        <h2 className="page-title"><Printer size={28} /> Models</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModel(true)}>
          <Plus size={18} /> Add Model
        </button>
      </div>

      {models.length === 0 ? (
        <div className="empty-state">
          <Printer />
          <p>No models added yet</p>
          <p style={{ fontSize: '0.85rem' }}>Add your 3D models to track filament usage and required parts</p>
        </div>
      ) : (
        models.map(model => (
          <div key={model.id} className="model-card">
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Model Image */}
              {model.imageUrl && (
                <div style={{ flexShrink: 0 }}>
                  <img 
                    src={model.imageUrl} 
                    alt={model.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <div className="model-header">
                  <div>
                    <div className="model-name">
                      {model.name}
                      {model.variantName && (
                        <span style={{
                          color: '#00ccff',
                          fontWeight: 'normal',
                          marginLeft: '8px'
                        }}>
                          — {model.variantName}
                        </span>
                      )}
                    </div>
                    {model.storeId && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '3px 8px', 
                        borderRadius: '10px', 
                        backgroundColor: getStoreColor(model.storeId) + '20',
                        color: getStoreColor(model.storeId),
                        border: `1px solid ${getStoreColor(model.storeId)}40`,
                        marginTop: '4px',
                        display: 'inline-block'
                      }}>
                        {getStoreName(model.storeId)}
                      </span>
                    )}
                  </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-small" onClick={() => setEditingModel(model)}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn btn-secondary btn-small" onClick={() => duplicateModel(model)} title="Create variant">
                  <Plus size={14} /> Variant
                </button>
                <button className="btn btn-danger btn-small" onClick={() => deleteModel(model.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="model-meta">
              <div className="model-meta-item">
                <Palette size={16} />
                Filament: <span>{model.filamentUsage}g</span>
              </div>
              {model.defaultColor && (
                <div className="model-meta-item">
                  Default Color: <span>{model.defaultColor}</span>
                </div>
              )}
            </div>
              </div>
            </div>
            
            {model.externalParts?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Required Parts:</div>
                <div className="parts-list">
                  {model.externalParts.map((part, idx) => (
                    <span key={idx} className="part-tag">
                      {part.name} x{part.quantity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Add Model Modal */}
      {showAddModel && (
        <div className="modal-overlay" onClick={() => setShowAddModel(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Model</h2>
              <button className="modal-close" onClick={() => setShowAddModel(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Model Name</label>
              <input
                type="text"
                className="form-input"
                value={newModel.name}
                onChange={e => setNewModel({ ...newModel, name: e.target.value })}
                placeholder="e.g., Lithophane Lamp"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Variant (matches "Extra" column)</label>
              <input
                type="text"
                className="form-input"
                value={newModel.variantName}
                onChange={e => setNewModel({ ...newModel, variantName: e.target.value })}
                placeholder="e.g., Small, Brown, Sage Green"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Store (Optional)</label>
              <select
                className="form-input"
                value={newModel.storeId}
                onChange={e => setNewModel({ ...newModel, storeId: e.target.value })}
              >
                <option value="">All Stores</option>
                {stores?.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Product Image</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {newModel.imageUrl && (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={newModel.imageUrl} 
                      alt="Preview" 
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => setNewModel({ ...newModel, imageUrl: '' })}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ff4757',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      <X size={12} color="#fff" />
                    </button>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageUpload(e, false)}
                    style={{ display: 'none' }}
                    id="model-image-upload"
                  />
                  <label 
                    htmlFor="model-image-upload"
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={16} />
                    {newModel.imageUrl ? 'Change Image' : 'Upload Image'}
                  </label>
                  <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '6px' }}>Max 500KB. JPG, PNG, or GIF.</p>
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Filament Usage (grams)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newModel.filamentUsage}
                  onChange={e => setNewModel({ ...newModel, filamentUsage: e.target.value })}
                  placeholder="e.g., 150"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Color</label>
                <input
                  type="text"
                  className="form-input"
                  value={newModel.defaultColor}
                  onChange={e => setNewModel({ ...newModel, defaultColor: e.target.value })}
                  placeholder="e.g., White"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">External Parts Required</label>
              {newModel.externalParts.length > 0 && (
                <div className="parts-list" style={{ marginBottom: '8px' }}>
                  {newModel.externalParts.map((part, idx) => (
                    <span key={idx} className="part-tag" style={{ cursor: 'pointer' }} onClick={() => removePartFromModel(idx, false)}>
                      {part.name} x{part.quantity} ✕
                    </span>
                  ))}
                </div>
              )}
              <div className="add-item-row">
                <select
                  className="add-item-input"
                  value={newPart.name}
                  onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">Select a part...</option>
                  {/* Get unique part names from all team members' inventory */}
                  {[...new Set(
                    Object.values(externalParts || {})
                      .flat()
                      .filter(p => p && p.name)
                      .map(p => p.name)
                  )].sort().map(partName => (
                    <option key={partName} value={partName}>{partName}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="Or type new part"
                  value={newPart.name}
                  onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="add-item-input"
                  placeholder="Qty"
                  value={newPart.quantity}
                  onChange={e => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                  style={{ width: '80px' }}
                />
                <button className="btn btn-secondary btn-small" onClick={() => addPartToModel(false)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModel(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addModel}>
                <Save size={18} /> Save Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Model Modal */}
      {editingModel && (
        <div className="modal-overlay" onClick={() => setEditingModel(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Model</h2>
              <button className="modal-close" onClick={() => setEditingModel(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Model Name</label>
              <input
                type="text"
                className="form-input"
                value={editingModel.name}
                onChange={e => setEditingModel({ ...editingModel, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Variant (matches "Extra" column)</label>
              <input
                type="text"
                className="form-input"
                value={editingModel.variantName || ''}
                onChange={e => setEditingModel({ ...editingModel, variantName: e.target.value })}
                placeholder="e.g., Small, Brown, Sage Green"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Store (Optional)</label>
              <select
                className="form-input"
                value={editingModel.storeId || ''}
                onChange={e => setEditingModel({ ...editingModel, storeId: e.target.value })}
              >
                <option value="">All Stores</option>
                {stores?.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Product Image</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {editingModel.imageUrl && (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={editingModel.imageUrl} 
                      alt="Preview" 
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => setEditingModel({ ...editingModel, imageUrl: '' })}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ff4757',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      <X size={12} color="#fff" />
                    </button>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageUpload(e, true)}
                    style={{ display: 'none' }}
                    id="edit-model-image-upload"
                  />
                  <label 
                    htmlFor="edit-model-image-upload"
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={16} />
                    {editingModel.imageUrl ? 'Change Image' : 'Upload Image'}
                  </label>
                  <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '6px' }}>Max 500KB. JPG, PNG, or GIF.</p>
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Filament Usage (grams)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingModel.filamentUsage}
                  onChange={e => setEditingModel({ ...editingModel, filamentUsage: parseFloat(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Color</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingModel.defaultColor || ''}
                  onChange={e => setEditingModel({ ...editingModel, defaultColor: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">External Parts Required</label>
              {(editingModel.externalParts || []).length > 0 && (
                <div className="parts-list" style={{ marginBottom: '8px' }}>
                  {editingModel.externalParts.map((part, idx) => (
                    <span key={idx} className="part-tag" style={{ cursor: 'pointer' }} onClick={() => removePartFromModel(idx, true)}>
                      {part.name} x{part.quantity} ✕
                    </span>
                  ))}
                </div>
              )}
              <div className="add-item-row">
                <select
                  className="add-item-input"
                  value={newPart.name}
                  onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">Select a part...</option>
                  {[...new Set(
                    Object.values(externalParts || {})
                      .flat()
                      .filter(p => p && p.name)
                      .map(p => p.name)
                  )].sort().map(partName => (
                    <option key={partName} value={partName}>{partName}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="Or type new part"
                  value={newPart.name}
                  onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="add-item-input"
                  placeholder="Qty"
                  value={newPart.quantity}
                  onChange={e => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                  style={{ width: '80px' }}
                />
                <button className="btn btn-secondary btn-small" onClick={() => addPartToModel(true)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setEditingModel(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={updateModel}>
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Supplies Tab Component (formerly External Parts)
function PartsTab({ externalParts, supplyCategories, teamMembers, saveExternalParts, saveSupplyCategories, showNotification }) {
  const [newPart, setNewPart] = useState({ name: '', quantity: '', categoryId: '', reorderAt: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Category management
  const addCategory = () => {
    if (!newCategory.trim()) {
      showNotification('Please enter a category name', 'error');
      return;
    }
    const category = {
      id: Date.now().toString(),
      name: newCategory.trim()
    };
    saveSupplyCategories([...supplyCategories, category]);
    setNewCategory('');
    showNotification('Category added');
  };

  const updateCategory = () => {
    if (!editingCategory.name.trim()) {
      showNotification('Please enter a category name', 'error');
      return;
    }
    const updated = supplyCategories.map(c => 
      c.id === editingCategory.id ? editingCategory : c
    );
    saveSupplyCategories(updated);
    setEditingCategory(null);
    showNotification('Category updated');
  };

  const deleteCategory = (categoryId) => {
    if (!confirm('Delete this category? Supplies in this category will become uncategorized.')) return;
    saveSupplyCategories(supplyCategories.filter(c => c.id !== categoryId));
    showNotification('Category deleted');
  };

  const addPart = (memberId) => {
    if (!newPart.name || !newPart.quantity) {
      showNotification('Please enter supply name and quantity', 'error');
      return;
    }
    
    const memberParts = [...(externalParts[memberId] || [])];
    const existing = memberParts.findIndex(p => 
      p.name.toLowerCase() === newPart.name.toLowerCase()
    );
    
    if (existing >= 0) {
      memberParts[existing].quantity += parseInt(newPart.quantity);
      // Update reorderAt if provided
      if (newPart.reorderAt) {
        memberParts[existing].reorderAt = parseInt(newPart.reorderAt);
      }
    } else {
      memberParts.push({
        id: Date.now().toString(),
        name: newPart.name,
        quantity: parseInt(newPart.quantity),
        categoryId: newPart.categoryId || null,
        reorderAt: newPart.reorderAt ? parseInt(newPart.reorderAt) : null
      });
    }
    
    saveExternalParts({ ...externalParts, [memberId]: memberParts });
    setNewPart({ name: '', quantity: '', categoryId: newPart.categoryId, reorderAt: '' });
    showNotification('Supply added successfully');
  };

  const updateQuantity = (memberId, partId, delta) => {
    const memberParts = [...(externalParts[memberId] || [])];
    const idx = memberParts.findIndex(p => p.id === partId);
    if (idx >= 0) {
      memberParts[idx] = {
        ...memberParts[idx],
        quantity: Math.max(0, memberParts[idx].quantity + delta)
      };
      saveExternalParts({ ...externalParts, [memberId]: memberParts });
    }
  };

  const removePart = (memberId, partId) => {
    const memberParts = (externalParts[memberId] || []).filter(p => p.id !== partId);
    saveExternalParts({ ...externalParts, [memberId]: memberParts });
    showNotification('Supply removed');
  };

  const getCategoryName = (categoryId) => {
    const cat = supplyCategories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Uncategorized';
  };

  const getFilteredParts = (memberId) => {
    const parts = externalParts[memberId] || [];
    if (selectedCategory === 'all') return parts;
    if (selectedCategory === 'uncategorized') return parts.filter(p => !p.categoryId);
    return parts.filter(p => p.categoryId === selectedCategory);
  };

  const partSuggestions = ['Light Puck', 'Plug-in Light', 'Clock Box', 'LED Strip', 'Battery Pack', 'USB Cable', 'Magnets', 'Screws', 'Nuts', 'Bolts'];

  return (
    <>
      <h2 className="page-title"><Box size={28} /> Supplies Inventory</h2>
      
      {/* Category Filter & Management */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#888' }}>Filter by Category:</span>
          <select
            className="assign-select"
            style={{ minWidth: '180px' }}
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="uncategorized">Uncategorized</option>
            {supplyCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
          <Settings size={16} /> Manage Categories
        </button>
      </div>
      
      <div className="inventory-grid">
        {teamMembers.map(member => {
          const filteredParts = getFilteredParts(member.id);
          const groupedParts = {};
          
          // Group parts by category
          filteredParts.forEach(part => {
            const catId = part.categoryId || 'uncategorized';
            if (!groupedParts[catId]) groupedParts[catId] = [];
            groupedParts[catId].push(part);
          });
          
          return (
          <div key={member.id} className="inventory-card">
            <h3><Box size={20} style={{ color: '#00ccff' }} /> {member.name}</h3>
            
            <div className="inventory-items">
              {filteredParts.length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>No supplies in this category</p>
              ) : (
                Object.entries(groupedParts).map(([catId, parts]) => (
                  <div key={catId} style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#00ff88', 
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <ChevronRight size={12} />
                      {catId === 'uncategorized' ? 'Uncategorized' : getCategoryName(catId)}
                    </div>
                    {parts.map(part => {
                      const needsRestock = part.reorderAt && part.quantity <= part.reorderAt;
                      return (
                      <div key={part.id} className="inventory-item" style={needsRestock ? { 
                        borderColor: 'rgba(255, 193, 7, 0.5)',
                        background: 'rgba(255, 193, 7, 0.1)'
                      } : {}}>
                        <div className="inventory-item-info">
                          <div className="inventory-item-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {part.name}
                            {needsRestock && (
                              <span style={{ 
                                fontSize: '0.65rem', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                background: 'rgba(255, 193, 7, 0.2)',
                                color: '#ffc107',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <AlertCircle size={10} /> Low Stock
                              </span>
                            )}
                          </div>
                          <div className="inventory-item-meta">
                            {part.quantity} in stock
                            {part.reorderAt && (
                              <span style={{ color: '#666', marginLeft: '8px' }}>
                                (reorder at {part.reorderAt})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="inventory-item-controls">
                          <button className="qty-btn" onClick={() => updateQuantity(member.id, part.id, -1)}>
                            <Minus size={14} />
                          </button>
                          <span className="qty-value">{part.quantity}</span>
                          <button className="qty-btn" onClick={() => updateQuantity(member.id, part.id, 1)}>
                            <Plus size={14} />
                          </button>
                          <button className="qty-btn" onClick={() => removePart(member.id, part.id)} style={{ marginLeft: '8px' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );})}
                  </div>
                ))
              )}
            </div>

            <div className="add-item-form">
              <div style={{ marginBottom: '8px' }}>
                <select
                  className="add-item-input"
                  value={newPart.categoryId}
                  onChange={e => setNewPart({ ...newPart, categoryId: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">Select Category (Optional)</option>
                  {supplyCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="Supply name (e.g., LED Light Puck, USB Cable)"
                  list={`parts-${member.id}`}
                  value={newPart.name}
                  onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '0.95rem' }}
                />
                <datalist id={`parts-${member.id}`}>
                  {partSuggestions.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="add-item-row">
                <input
                  type="number"
                  className="add-item-input"
                  placeholder="Quantity"
                  value={newPart.quantity}
                  onChange={e => setNewPart({ ...newPart, quantity: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="add-item-input"
                  placeholder="Reorder at"
                  title="Alert when stock falls to this level"
                  value={newPart.reorderAt}
                  onChange={e => setNewPart({ ...newPart, reorderAt: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-small" onClick={() => addPart(member.id)}>
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          </div>
        );})}
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Categories</h2>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            {/* Add New Category */}
            <div className="form-group">
              <label className="form-label">Add New Category</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Category name"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                />
                <button className="btn btn-primary" onClick={addCategory}>
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
            
            {/* Existing Categories */}
            <div className="form-group">
              <label className="form-label">Existing Categories</label>
              {supplyCategories.length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>No categories yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {supplyCategories.map(cat => (
                    <div key={cat.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px'
                    }}>
                      {editingCategory?.id === cat.id ? (
                        <>
                          <input
                            type="text"
                            className="form-input"
                            value={editingCategory.name}
                            onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            style={{ flex: 1 }}
                          />
                          <button className="btn btn-primary btn-small" onClick={updateCategory}>
                            <Save size={14} />
                          </button>
                          <button className="btn btn-secondary btn-small" onClick={() => setEditingCategory(null)}>
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1, color: '#fff' }}>{cat.name}</span>
                          <button className="btn btn-secondary btn-small" onClick={() => setEditingCategory(cat)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-danger btn-small" onClick={() => deleteCategory(cat.id)}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Restock Tab Component
function RestockTab({ externalParts, supplyCategories, teamMembers, filaments }) {
  const FILAMENT_REORDER_THRESHOLD = 250; // grams
  
  // Collect all supplies that need restocking
  const restockSupplies = [];
  teamMembers.forEach(member => {
    const memberParts = externalParts[member.id] || [];
    memberParts.forEach(part => {
      if (part.reorderAt && part.quantity <= part.reorderAt) {
        restockSupplies.push({
          ...part,
          type: 'supply',
          memberId: member.id,
          memberName: member.name
        });
      }
    });
  });

  // Collect all filaments that need restocking (<=250g and 0 rolls)
  const restockFilaments = [];
  teamMembers.forEach(member => {
    const memberFilaments = filaments[member.id] || [];
    memberFilaments.forEach(fil => {
      if (fil.amount <= FILAMENT_REORDER_THRESHOLD && (fil.rolls || 0) === 0) {
        restockFilaments.push({
          ...fil,
          type: 'filament',
          memberId: member.id,
          memberName: member.name
        });
      }
    });
  });

  // Group supplies by category
  const groupedSupplies = {};
  restockSupplies.forEach(item => {
    const catId = item.categoryId || 'uncategorized';
    if (!groupedSupplies[catId]) groupedSupplies[catId] = [];
    groupedSupplies[catId].push(item);
  });

  const getCategoryName = (categoryId) => {
    if (categoryId === 'uncategorized') return 'Uncategorized';
    const cat = supplyCategories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Uncategorized';
  };

  const totalRestockCount = restockSupplies.length + restockFilaments.length;

  return (
    <>
      <h2 className="page-title"><ShoppingBag size={28} /> Restock List</h2>
      
      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Items to Restock</div>
          <div className="stat-value" style={{ color: totalRestockCount > 0 ? '#ffc107' : '#00ff88' }}>
            {totalRestockCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Supplies</div>
          <div className="stat-value" style={{ color: restockSupplies.length > 0 ? '#ffc107' : '#00ff88' }}>
            {restockSupplies.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Filaments</div>
          <div className="stat-value" style={{ color: restockFilaments.length > 0 ? '#ffc107' : '#00ff88' }}>
            {restockFilaments.length}
          </div>
        </div>
      </div>

      {totalRestockCount === 0 ? (
        <div className="empty-state">
          <Check size={48} style={{ color: '#00ff88' }} />
          <p>All inventory is well stocked!</p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>Items will appear here when they fall to or below their reorder level</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Filaments Section */}
          {restockFilaments.length > 0 && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              borderRadius: '12px', 
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                color: '#00ff88'
              }}>
                <Palette size={20} />
                Filament
                <span style={{ 
                  fontSize: '0.75rem', 
                  background: 'rgba(255, 193, 7, 0.2)', 
                  color: '#ffc107',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  marginLeft: '8px'
                }}>
                  {restockFilaments.length} color{restockFilaments.length !== 1 ? 's' : ''}
                </span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {restockFilaments.map(fil => (
                  <div key={`${fil.memberId}-${fil.id}`} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: 'rgba(255, 193, 7, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 193, 7, 0.2)'
                  }}>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div className="color-dot" style={{ backgroundColor: fil.colorHex, width: '16px', height: '16px' }} />
                        {fil.color}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                        <span style={{ color: '#00ccff' }}>{fil.memberName}</span>
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span style={{ color: '#ff6b6b' }}>{fil.amount.toFixed(0)}g</span> remaining
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span style={{ color: '#888' }}>0 backup rolls</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#888', 
                        marginBottom: '4px' 
                      }}>
                        Suggested Order
                      </div>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '700', 
                        color: '#00ff88',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                        +1 roll
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplies by Category */}
          {Object.entries(groupedSupplies).map(([catId, items]) => (
            <div key={catId} style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              borderRadius: '12px', 
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                color: '#00ff88'
              }}>
                <Box size={20} />
                {getCategoryName(catId)}
                <span style={{ 
                  fontSize: '0.75rem', 
                  background: 'rgba(255, 193, 7, 0.2)', 
                  color: '#ffc107',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  marginLeft: '8px'
                }}>
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map(item => {
                  const suggestedOrder = Math.max(0, (item.reorderAt * 2) - item.quantity);
                  return (
                    <div key={`${item.memberId}-${item.id}`} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: 'rgba(255, 193, 7, 0.08)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 193, 7, 0.2)'
                    }}>
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <AlertCircle size={16} style={{ color: '#ffc107' }} />
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                          <span style={{ color: '#00ccff' }}>{item.memberName}</span>
                          <span style={{ margin: '0 8px' }}>•</span>
                          <span style={{ color: '#ff6b6b' }}>{item.quantity}</span> in stock
                          <span style={{ margin: '0 8px' }}>•</span>
                          Reorder at <span style={{ color: '#ffc107' }}>{item.reorderAt}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#888', 
                          marginBottom: '4px' 
                        }}>
                          Suggested Order
                        </div>
                        <div style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '700', 
                          color: '#00ff88',
                          fontFamily: 'JetBrains Mono, monospace'
                        }}>
                          +{suggestedOrder}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Archive Tab Component
function ArchiveTab({ archivedOrders, teamMembers, models }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOrders = archivedOrders.filter(o => 
    o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMemberName = (id) => teamMembers.find(m => m.id === id)?.name || 'Unknown';
  
  // Find matching model by name
  const findMatchingModel = (order) => {
    return models?.find(m => {
      const modelName = m.name.toLowerCase();
      const orderItem = (order.item || '').toLowerCase();
      return orderItem.includes(modelName) || modelName.includes(orderItem);
    });
  };

  return (
    <>
      <h2 className="page-title"><Archive size={28} /> Archived Orders</h2>
      
      <div className="archive-filters">
        <input
          type="text"
          className="filter-input"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, maxWidth: '400px' }}
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <Archive />
          <p>No archived orders</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => {
            const matchingModel = findMatchingModel(order);
            return (
            <div key={order.orderId} className="order-card" style={{ opacity: 0.8 }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Model Image */}
                {matchingModel?.imageUrl ? (
                  <div style={{ flexShrink: 0 }}>
                    <img 
                      src={matchingModel.imageUrl} 
                      alt={matchingModel.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    flexShrink: 0,
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Image size={20} style={{ color: '#444' }} />
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <div className="order-header">
                    <div>
                      <div className="order-id">{order.orderId}</div>
                      <div className="order-item">{order.item}</div>
                    </div>
                    <span className="status-badge status-shipped">
                      <Archive size={14} /> Archived
                    </span>
                  </div>
                </div>
              </div>
              <div className="order-details">
                <div className="detail-item">
                  <span className="detail-label">Quantity</span>
                  <span className="detail-value">{order.quantity}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Color</span>
                  <span className="detail-value">{order.color || 'N/A'}</span>
                </div>
                {order.extra && (
                  <div className="detail-item">
                    <span className="detail-label">Extra</span>
                    <span className="detail-value">{order.extra}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Fulfilled By</span>
                  <span className="detail-value">{getMemberName(order.assignedTo)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Archived</span>
                  <span className="detail-value">
                    {new Date(order.archivedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );})}
        </div>
      )}
    </>
  );
}

// Team Tab Component
function TeamTab({ teamMembers, saveTeamMembers, orders, filaments, externalParts, showNotification }) {
  const [editingMember, setEditingMember] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');

  const addMember = () => {
    if (!newMemberName.trim()) {
      showNotification('Please enter a name', 'error');
      return;
    }
    
    const newMember = {
      id: `member${Date.now()}`,
      name: newMemberName.trim()
    };
    
    saveTeamMembers([...teamMembers, newMember]);
    setNewMemberName('');
    showNotification('Team member added');
  };

  const updateMemberName = (id, name) => {
    const updated = teamMembers.map(m => m.id === id ? { ...m, name } : m);
    saveTeamMembers(updated);
    setEditingMember(null);
    showNotification('Name updated');
  };

  const removeMember = (id) => {
    if (teamMembers.length <= 1) {
      showNotification('Cannot remove last team member', 'error');
      return;
    }
    saveTeamMembers(teamMembers.filter(m => m.id !== id));
    showNotification('Team member removed');
  };

  return (
    <>
      <h2 className="page-title"><Users size={28} /> Team Management</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <div className="add-item-row" style={{ maxWidth: '400px' }}>
          <input
            type="text"
            className="add-item-input"
            placeholder="New member name"
            value={newMemberName}
            onChange={e => setNewMemberName(e.target.value)}
          />
          <button className="btn btn-primary btn-small" onClick={addMember}>
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      {teamMembers.map(member => {
        const memberOrders = orders.filter(o => o.assignedTo === member.id);
        const activeOrders = memberOrders.filter(o => o.status !== 'shipped');
        const memberFilaments = filaments[member.id] || [];
        const memberParts = externalParts[member.id] || [];
        const totalFilament = memberFilaments.reduce((sum, f) => sum + f.amount, 0);
        const totalParts = memberParts.reduce((sum, p) => sum + p.quantity, 0);

        return (
          <div key={member.id} className="team-member-card">
            <div className="team-member-header">
              {editingMember === member.id ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={member.name}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') updateMemberName(member.id, e.target.value);
                      if (e.key === 'Escape') setEditingMember(null);
                    }}
                    style={{ width: '200px' }}
                  />
                  <button className="btn btn-secondary btn-small" onClick={() => setEditingMember(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="team-member-name">
                  <Users size={24} style={{ color: '#00ff88' }} />
                  {member.name}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-small" onClick={() => setEditingMember(member.id)}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn btn-danger btn-small" onClick={() => removeMember(member.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="team-member-stats">
              <div className="team-stat">
                <div className="team-stat-value">{activeOrders.length}</div>
                <div className="team-stat-label">Active Orders</div>
              </div>
              <div className="team-stat">
                <div className="team-stat-value">{totalFilament.toFixed(0)}g</div>
                <div className="team-stat-label">Total Filament</div>
              </div>
              <div className="team-stat">
                <div className="team-stat-value">{totalParts}</div>
                <div className="team-stat-label">External Parts</div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
