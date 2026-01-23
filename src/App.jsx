import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Printer, Users, User, Archive, Upload, ChevronRight, ChevronUp, ChevronDown, Check, Truck, Clock, Palette, Box, Settings, BarChart3, Plus, Minus, Trash2, Edit2, Save, X, AlertCircle, Zap, Store, ShoppingBag, Image, RefreshCw, DollarSign, TrendingUp, Star, ExternalLink, PieChart, Percent } from 'lucide-react';
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

// Default printers
const DEFAULT_PRINTERS = [
  { id: 'printer1', name: 'Printer 1', totalHours: 0, ownerId: null }
];

// Production stages
const PRODUCTION_STAGES = [
  { id: 'printing', name: 'Printing', color: '#00ccff', icon: 'Printer' },
  { id: 'curing', name: 'Curing', color: '#ff9f43', icon: 'Clock' },
  { id: 'assembly', name: 'Assembly', color: '#a55eea', icon: 'Box' },
  { id: 'qc', name: 'QC', color: '#2ed573', icon: 'Check' },
  { id: 'packed', name: 'Packed', color: '#00ff88', icon: 'Package' }
];

// Low Stock Alerts Component
function LowStockAlerts({ filaments, externalParts, teamMembers, models, setActiveTab }) {
  const [dismissed, setDismissed] = useState(false);

  // Collect all low stock items
  const lowStockItems = [];

  // Check filaments
  teamMembers.forEach(member => {
    const memberFilaments = filaments[member.id] || [];
    memberFilaments.forEach(fil => {
      const threshold = fil.reorderAt ?? 250;
      if (fil.amount <= threshold && (fil.backupRolls?.length || 0) === 0) {
        lowStockItems.push({
          type: 'filament',
          name: fil.color,
          member: member.name,
          current: `${fil.amount.toFixed(0)}g`,
          threshold: `${threshold}g`
        });
      }
    });
  });

  // Check supplies
  teamMembers.forEach(member => {
    const memberParts = externalParts[member.id] || [];
    memberParts.forEach(part => {
      if (part.reorderAt && part.quantity <= part.reorderAt) {
        lowStockItems.push({
          type: 'supply',
          name: part.name,
          member: member.name,
          current: part.quantity.toString(),
          threshold: part.reorderAt.toString()
        });
      }
    });
  });

  // Check model stock (stock count ≤ 3)
  (models || []).forEach(model => {
    if (model.stockCount !== null && model.stockCount !== undefined && model.stockCount <= 3) {
      lowStockItems.push({
        type: 'model',
        name: model.name + (model.variantName ? ` (${model.variantName})` : ''),
        current: model.stockCount.toString(),
        threshold: '3'
      });
    }
  });

  // Don't show if dismissed or no items
  if (dismissed || lowStockItems.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 107, 107, 0.1) 100%)',
      border: '1px solid rgba(255, 193, 7, 0.4)',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px'
    }}>
      <AlertCircle size={24} style={{ color: '#ffc107', flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ margin: 0, color: '#ffc107', fontWeight: '600' }}>
            Low Stock Alert - {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} need restock
          </h4>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {lowStockItems.slice(0, 5).map((item, idx) => (
            <span key={idx} style={{
              background: item.type === 'filament' ? 'rgba(0, 204, 255, 0.2)' : item.type === 'model' ? 'rgba(165, 94, 234, 0.2)' : 'rgba(0, 255, 136, 0.2)',
              border: `1px solid ${item.type === 'filament' ? 'rgba(0, 204, 255, 0.4)' : item.type === 'model' ? 'rgba(165, 94, 234, 0.4)' : 'rgba(0, 255, 136, 0.4)'}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.8rem',
              color: item.type === 'filament' ? '#00ccff' : item.type === 'model' ? '#a55eea' : '#00ff88'
            }}>
              {item.type === 'filament' ? <Palette size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> : item.type === 'model' ? <Printer size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> : <Box size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
              {item.name} ({item.current})
            </span>
          ))}
          {lowStockItems.length > 5 && (
            <span style={{ color: '#888', fontSize: '0.8rem', padding: '4px 10px' }}>
              +{lowStockItems.length - 5} more
            </span>
          )}
        </div>
        <button
          onClick={() => setActiveTab('restock')}
          style={{
            background: 'rgba(255, 193, 7, 0.2)',
            border: '1px solid rgba(255, 193, 7, 0.4)',
            borderRadius: '6px',
            padding: '6px 14px',
            color: '#ffc107',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}
        >
          View Restock List
        </button>
      </div>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ orders, archivedOrders, purchases, models, stores, filaments, externalParts }) {
  const [timeRange, setTimeRange] = useState('month'); // week, month, year, all

  // Combine orders and archived orders for revenue calculation
  const allOrders = [...(orders || []), ...(archivedOrders || [])];

  // Filter by time range
  const getFilteredData = (data, dateField = 'createdAt') => {
    if (!data || !Array.isArray(data)) return [];
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate;
    });
  };

  // Etsy fee constants
  const TRANSACTION_FEE_RATE = 0.065; // 6.5%
  const PAYMENT_PROCESSING_RATE = 0.03; // 3%
  const PAYMENT_PROCESSING_FLAT = 0.25; // $0.25
  const SALES_TAX_RATE = 0.0752; // 7.52% (fallback if no actual tax)

  // Calculate revenue from orders (shipped orders) with fees breakdown
  const calculateRevenueWithFees = () => {
    const shippedOrders = getFilteredData(allOrders).filter(o => o.status === 'shipped');
    let totalOrderAmount = 0;
    let totalSalesTax = 0;
    let totalTransactionFees = 0;
    let totalPaymentFees = 0;

    shippedOrders.forEach(order => {
      const priceStr = order.price?.replace(/[^0-9.]/g, '') || '0';
      const orderTotal = parseFloat(priceStr) || 0;

      // Use actual sales tax if available, otherwise estimate
      let salesTax;
      if (order.salesTax != null && order.salesTax > 0) {
        salesTax = order.salesTax;
      } else {
        const preTaxAmount = orderTotal / (1 + SALES_TAX_RATE);
        salesTax = orderTotal - preTaxAmount;
      }

      const transactionFee = orderTotal * TRANSACTION_FEE_RATE;
      const paymentFee = (orderTotal * PAYMENT_PROCESSING_RATE) + PAYMENT_PROCESSING_FLAT;

      totalOrderAmount += orderTotal;
      totalSalesTax += salesTax;
      totalTransactionFees += transactionFee;
      totalPaymentFees += paymentFee;
    });

    const actualRevenue = totalOrderAmount - totalSalesTax; // Revenue after extracting tax
    const totalFees = totalTransactionFees + totalPaymentFees;

    return {
      orderTotal: totalOrderAmount,
      actualRevenue,
      salesTax: totalSalesTax,
      transactionFees: totalTransactionFees,
      paymentFees: totalPaymentFees,
      totalFees
    };
  };

  // Calculate material costs from orders (filament + external parts)
  const calculateExpenses = () => {
    const shippedOrders = getFilteredData(allOrders).filter(o => o.status === 'shipped');
    return shippedOrders.reduce((sum, o) => sum + (parseFloat(o.materialCost) || 0), 0);
  };

  // Calculate shipping costs
  const calculateShippingCosts = () => {
    const shippedOrders = getFilteredData(allOrders).filter(o => o.status === 'shipped');
    return shippedOrders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  };

  // Get order counts
  const getOrderCounts = () => {
    const filteredOrders = getFilteredData(allOrders);
    return {
      total: filteredOrders.length,
      shipped: filteredOrders.filter(o => o.status === 'shipped').length,
      fulfilled: filteredOrders.filter(o => o.status === 'fulfilled').length,
      pending: filteredOrders.filter(o => o.status === 'received').length
    };
  };

  // Get top selling models
  const getTopModels = () => {
    const filteredOrders = getFilteredData(allOrders);
    const modelCounts = {};

    filteredOrders.forEach(order => {
      const item = order.item || 'Unknown';
      if (!modelCounts[item]) {
        modelCounts[item] = { name: item, count: 0, quantity: 0, revenue: 0 };
      }
      modelCounts[item].count++;
      modelCounts[item].quantity += order.quantity || 1;
      const priceStr = order.price?.replace(/[^0-9.]/g, '') || '0';
      modelCounts[item].revenue += parseFloat(priceStr) || 0;
    });

    return Object.values(modelCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Get revenue by store
  const getRevenueByStore = () => {
    const filteredOrders = getFilteredData(allOrders).filter(o => o.status === 'shipped');
    const storeRevenue = {};

    filteredOrders.forEach(order => {
      const storeId = order.storeId || 'unknown';
      if (!storeRevenue[storeId]) {
        storeRevenue[storeId] = { id: storeId, revenue: 0, orders: 0 };
      }
      const priceStr = order.price?.replace(/[^0-9.]/g, '') || '0';
      storeRevenue[storeId].revenue += parseFloat(priceStr) || 0;
      storeRevenue[storeId].orders++;
    });

    return Object.values(storeRevenue).map(sr => ({
      ...sr,
      name: (stores || []).find(s => s.id === sr.id)?.name || 'Unknown Store'
    })).sort((a, b) => b.revenue - a.revenue);
  };

  // Get best selling colors (with filament weight calculation)
  const getTopColors = () => {
    const filteredOrders = getFilteredData(allOrders);
    const colorCounts = {};

    filteredOrders.forEach(order => {
      const color = (order.color || '').trim();
      if (!color) return; // Skip orders without color

      const normalizedColor = color.toLowerCase();
      if (!colorCounts[normalizedColor]) {
        colorCounts[normalizedColor] = {
          name: color, // Keep original casing for display
          count: 0,
          quantity: 0,
          revenue: 0,
          filamentWeight: 0
        };
      }
      colorCounts[normalizedColor].count++;
      colorCounts[normalizedColor].quantity += order.quantity || 1;
      const priceStr = order.price?.replace(/[^0-9.]/g, '') || '0';
      colorCounts[normalizedColor].revenue += parseFloat(priceStr) || 0;

      // Find matching model and calculate filament weight
      const orderItem = (order.item || '').toLowerCase();
      const matchingModel = models?.find(m => {
        const modelName = m.name.toLowerCase();
        // Check main name
        if (orderItem.includes(modelName) || modelName.includes(orderItem)) return true;
        // Check aliases
        if (m.aliases?.some(alias => orderItem.includes(alias.toLowerCase()))) return true;
        return false;
      });

      if (matchingModel) {
        // Get filament usage from printer settings
        const printerSettings = matchingModel.printerSettings?.find(ps => ps.printerId === order.printerId)
          || matchingModel.printerSettings?.[0];

        // Sum filament from all plates, or use legacy filamentUsage
        let filamentUsage = 0;
        if (printerSettings?.plates?.length > 0) {
          filamentUsage = printerSettings.plates.reduce((sum, plate) =>
            sum + (parseFloat(plate.filamentUsage) || 0), 0);
        } else if (matchingModel.filamentUsage) {
          filamentUsage = parseFloat(matchingModel.filamentUsage) || 0;
        }

        colorCounts[normalizedColor].filamentWeight += filamentUsage * (order.quantity || 1);
      }
    });

    return Object.values(colorCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  };

  const revenueData = calculateRevenueWithFees();
  const expenses = calculateExpenses();
  const shippingCosts = calculateShippingCosts();
  // Net profit = actual revenue - expenses - shipping - Etsy fees
  const netProfit = revenueData.actualRevenue - expenses - shippingCosts - revenueData.totalFees;
  const orderCounts = getOrderCounts();
  const topModels = getTopModels();
  const revenueByStore = getRevenueByStore();
  const topColors = getTopColors();

  return (
    <>
      <div className="section-header">
        <h2 className="page-title"><TrendingUp size={28} /> Revenue Dashboard</h2>
        <select
          className="form-input"
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 255, 136, 0.05) 100%)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Revenue (after tax)</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>
            ${revenueData.actualRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
            ${revenueData.orderTotal.toFixed(2)} total - ${revenueData.salesTax.toFixed(2)} tax
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 159, 67, 0.15) 0%, rgba(255, 159, 67, 0.05) 100%)',
          border: '1px solid rgba(255, 159, 67, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Etsy Fees</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ff9f43', fontFamily: 'JetBrains Mono, monospace' }}>
            ${revenueData.totalFees.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
            6.5% + 3% + $0.25/order
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.05) 100%)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Material Expenses</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace' }}>
            ${expenses.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
            From purchases & materials
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 204, 255, 0.15) 0%, rgba(0, 204, 255, 0.05) 100%)',
          border: '1px solid rgba(0, 204, 255, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Shipping Costs</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#00ccff', fontFamily: 'JetBrains Mono, monospace' }}>
            ${shippingCosts.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
            Avg ${(shippingCosts / (orderCounts.shipped || 1)).toFixed(2)}/order
          </div>
        </div>

        <div style={{
          background: netProfit >= 0
            ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 204, 255, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 193, 7, 0.1) 100%)',
          border: `1px solid ${netProfit >= 0 ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 107, 107, 0.4)'}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Net Profit</div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: netProfit >= 0 ? '#00ff88' : '#ff6b6b',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
            {revenueData.actualRevenue > 0 ? `${((netProfit / revenueData.actualRevenue) * 100).toFixed(1)}% margin` : 'No revenue yet'}
          </div>
        </div>
      </div>

      {/* Order Status Summary */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{ color: '#00ff88', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={20} /> Order Summary
        </h3>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fff' }}>{orderCounts.total}</div>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>Total Orders</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffc107' }}>{orderCounts.pending}</div>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>In Progress</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#00ccff' }}>{orderCounts.fulfilled}</div>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>Ready to Ship</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#00ff88' }}>{orderCounts.shipped}</div>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>Shipped</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {/* Top Selling Items */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ color: '#00ccff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Star size={20} /> Top Selling Items
          </h3>
          {topModels.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No orders yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topModels.map((model, idx) => (
                <div key={model.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      background: idx === 0 ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      color: idx === 0 ? '#ffc107' : '#888',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: '500', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {model.name?.slice(0, 30)}{model.name?.length > 30 ? '...' : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        {model.count} orders • {model.quantity} items
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#00ff88', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace' }}>
                    ${model.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Store */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ color: '#00ff88', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Store size={20} /> Revenue by Store
          </h3>
          {revenueByStore.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No store data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {revenueByStore.map((store, idx) => {
                const percentage = revenueData.orderTotal > 0 ? (store.revenue / revenueData.orderTotal) * 100 : 0;
                return (
                  <div key={store.id} style={{
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '500' }}>{store.name}</span>
                      <span style={{ color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>
                        ${store.revenue.toFixed(2)}
                      </span>
                    </div>
                    <div style={{
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00ff88, #00ccff)',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                      {store.orders} orders • {percentage.toFixed(1)}% of revenue
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Best Selling Colors */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ color: '#a55eea', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Palette size={20} /> Best Selling Colors
          </h3>
          {topColors.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No color data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topColors.map((color, idx) => {
                const maxQty = topColors[0]?.quantity || 1;
                const percentage = (color.quantity / maxQty) * 100;
                return (
                  <div key={color.name} style={{
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          background: idx === 0 ? 'rgba(165, 94, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                          color: idx === 0 ? '#a55eea' : '#888',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{color.name}</span>
                      </div>
                      <span style={{ color: '#a55eea', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace' }}>
                        {color.quantity} sold
                      </span>
                    </div>
                    <div style={{
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #a55eea, #7c3aed)',
                        borderRadius: '2px'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                      {color.count} orders • ${color.revenue.toFixed(2)} revenue
                      {color.filamentWeight > 0 && (
                        <span style={{ color: '#00ccff' }}> • {color.filamentWeight.toFixed(0)}g filament</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Analytics Tab Component - Color stats and filament usage tracking
function AnalyticsTab({ orders, setOrders, archivedOrders, setArchivedOrders, models, filaments, teamMembers, filamentUsageHistory, showNotification }) {
  const [timeRange, setTimeRange] = useState('all'); // week, month, year, all
  const [sortBy, setSortBy] = useState('quantity'); // quantity, weight, revenue
  const [editingColor, setEditingColor] = useState(null);
  const [newColorName, setNewColorName] = useState('');

  // Rename a color across all orders
  const renameColor = () => {
    if (!editingColor || !newColorName.trim()) return;

    const oldColorLower = editingColor.toLowerCase();
    const newColor = newColorName.trim();

    // Update active orders
    const updatedOrders = orders.map(o => {
      if ((o.color || '').toLowerCase() === oldColorLower) {
        return { ...o, color: newColor };
      }
      return o;
    });

    // Update archived orders
    const updatedArchived = archivedOrders.map(o => {
      if ((o.color || '').toLowerCase() === oldColorLower) {
        return { ...o, color: newColor };
      }
      return o;
    });

    // Count how many were updated
    const activeCount = orders.filter(o => (o.color || '').toLowerCase() === oldColorLower).length;
    const archivedCount = archivedOrders.filter(o => (o.color || '').toLowerCase() === oldColorLower).length;

    setOrders(updatedOrders);
    setArchivedOrders(updatedArchived);
    setEditingColor(null);
    setNewColorName('');
    showNotification(`Renamed "${editingColor}" to "${newColor}" on ${activeCount + archivedCount} orders`);
  };

  // Delete/clear a color from orders (set to empty)
  const clearColor = () => {
    if (!editingColor) return;

    const oldColorLower = editingColor.toLowerCase();

    // Update active orders
    const updatedOrders = orders.map(o => {
      if ((o.color || '').toLowerCase() === oldColorLower) {
        return { ...o, color: '' };
      }
      return o;
    });

    // Update archived orders
    const updatedArchived = archivedOrders.map(o => {
      if ((o.color || '').toLowerCase() === oldColorLower) {
        return { ...o, color: '' };
      }
      return o;
    });

    const activeCount = orders.filter(o => (o.color || '').toLowerCase() === oldColorLower).length;
    const archivedCount = archivedOrders.filter(o => (o.color || '').toLowerCase() === oldColorLower).length;

    setOrders(updatedOrders);
    setArchivedOrders(updatedArchived);
    setEditingColor(null);
    setNewColorName('');
    showNotification(`Cleared "${editingColor}" from ${activeCount + archivedCount} orders`);
  };

  // Combine all orders for analysis
  const allOrders = [...(orders || []), ...(archivedOrders || [])];

  // Filter by time range
  const getFilteredOrders = () => {
    if (timeRange === 'all') return allOrders;

    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return allOrders;
    }

    return allOrders.filter(order => {
      const orderDate = new Date(order.createdAt || order.archivedAt);
      return orderDate >= startDate;
    });
  };

  // Calculate comprehensive color stats
  const getColorStats = () => {
    const filteredOrders = getFilteredOrders();
    const colorStats = {};

    filteredOrders.forEach(order => {
      const color = (order.color || '').trim();
      if (!color) return;

      const normalizedColor = color.toLowerCase();
      if (!colorStats[normalizedColor]) {
        colorStats[normalizedColor] = {
          name: color,
          orderCount: 0,
          quantity: 0,
          revenue: 0,
          filamentWeight: 0
        };
      }

      colorStats[normalizedColor].orderCount++;
      colorStats[normalizedColor].quantity += order.quantity || 1;

      const priceStr = order.price?.replace(/[^0-9.]/g, '') || '0';
      colorStats[normalizedColor].revenue += parseFloat(priceStr) || 0;

      // Calculate filament weight from matching model
      const orderItem = (order.item || '').toLowerCase();
      const matchingModel = models?.find(m => {
        const modelName = m.name.toLowerCase();
        if (orderItem.includes(modelName) || modelName.includes(orderItem)) return true;
        if (m.aliases?.some(alias => orderItem.includes(alias.toLowerCase()))) return true;
        return false;
      });

      if (matchingModel) {
        const printerSettings = matchingModel.printerSettings?.find(ps => ps.printerId === order.printerId)
          || matchingModel.printerSettings?.[0];

        let filamentUsage = 0;
        if (printerSettings?.plates?.length > 0) {
          filamentUsage = printerSettings.plates.reduce((sum, plate) =>
            sum + (parseFloat(plate.filamentUsage) || 0), 0);
        } else if (matchingModel.filamentUsage) {
          filamentUsage = parseFloat(matchingModel.filamentUsage) || 0;
        }

        colorStats[normalizedColor].filamentWeight += filamentUsage * (order.quantity || 1);
      }
    });

    // Sort based on selected criteria
    const sorted = Object.values(colorStats).sort((a, b) => {
      switch (sortBy) {
        case 'weight': return b.filamentWeight - a.filamentWeight;
        case 'revenue': return b.revenue - a.revenue;
        default: return b.quantity - a.quantity;
      }
    });

    return sorted;
  };

  // Calculate usage rate from history (grams per week)
  const getUsageRate = (color) => {
    const colorHistory = (filamentUsageHistory || []).filter(h =>
      h.color?.toLowerCase() === color.toLowerCase()
    );

    if (colorHistory.length < 2) return null;

    // Sort by date
    const sorted = [...colorHistory].sort((a, b) => a.date - b.date);
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const daysDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));

    const totalUsed = colorHistory.reduce((sum, h) => sum + (h.amount || 0), 0);
    const dailyRate = totalUsed / daysDiff;
    const weeklyRate = dailyRate * 7;

    return {
      daily: dailyRate,
      weekly: weeklyRate,
      monthly: dailyRate * 30,
      totalUsed,
      dataPoints: colorHistory.length
    };
  };

  // Get current inventory for a color
  const getColorInventory = (colorName) => {
    let total = 0;
    teamMembers.forEach(member => {
      const memberFilaments = filaments[member.id] || [];
      memberFilaments.forEach(fil => {
        if (fil.color.toLowerCase() === colorName.toLowerCase()) {
          total += fil.amount + (fil.backupRolls?.length || 0) * 1000;
        }
      });
    });
    return total;
  };

  // Calculate days until reorder
  const getDaysUntilReorder = (color, currentInventory) => {
    const rate = getUsageRate(color);
    if (!rate || rate.daily === 0) return null;

    // Find reorder threshold for this color
    let reorderThreshold = 250; // default
    teamMembers.forEach(member => {
      const memberFilaments = filaments[member.id] || [];
      memberFilaments.forEach(fil => {
        if (fil.color.toLowerCase() === color.toLowerCase() && fil.reorderAt) {
          reorderThreshold = fil.reorderAt;
        }
      });
    });

    const usableInventory = currentInventory - reorderThreshold;
    if (usableInventory <= 0) return 0;

    return Math.floor(usableInventory / rate.daily);
  };

  const colorStats = getColorStats();
  const totalFilamentUsed = colorStats.reduce((sum, c) => sum + c.filamentWeight, 0);
  const totalRevenue = colorStats.reduce((sum, c) => sum + c.revenue, 0);
  const totalQuantity = colorStats.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <>
      <div className="section-header">
        <h2 className="page-title"><BarChart3 size={28} /> Color Analytics</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="form-input"
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            style={{ padding: '8px 12px', minWidth: '120px' }}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <select
            className="form-input"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', minWidth: '140px' }}
          >
            <option value="quantity">Sort by Quantity</option>
            <option value="weight">Sort by Weight</option>
            <option value="revenue">Sort by Revenue</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(165, 94, 234, 0.1) 0%, rgba(165, 94, 234, 0.05) 100%)',
          border: '1px solid rgba(165, 94, 234, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Total Colors Tracked</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#a55eea', fontFamily: 'JetBrains Mono, monospace' }}>
            {colorStats.length}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 204, 255, 0.1) 0%, rgba(0, 204, 255, 0.05) 100%)',
          border: '1px solid rgba(0, 204, 255, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Total Items Sold</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#00ccff', fontFamily: 'JetBrains Mono, monospace' }}>
            {totalQuantity.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Total Filament Used</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>
            {(totalFilamentUsed / 1000).toFixed(2)} kg
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ffc107', fontFamily: 'JetBrains Mono, monospace' }}>
            ${totalRevenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Color Stats Table */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ color: '#a55eea', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Palette size={20} /> Color Breakdown
        </h3>

        {colorStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <Palette size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>No color data available yet</p>
            <p style={{ fontSize: '0.85rem' }}>Import orders with color information to see analytics</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Rank</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Color</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Qty Sold</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Orders</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Filament Used</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Revenue</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Inventory</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Usage Rate</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Reorder In</th>
                </tr>
              </thead>
              <tbody>
                {colorStats.map((color, idx) => {
                  const inventory = getColorInventory(color.name);
                  const usageRate = getUsageRate(color.name);
                  const daysUntilReorder = getDaysUntilReorder(color.name, inventory);
                  const isLow = daysUntilReorder !== null && daysUntilReorder <= 14;
                  const isCritical = daysUntilReorder !== null && daysUntilReorder <= 7;

                  return (
                    <tr key={color.name} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: isCritical ? 'rgba(255, 107, 107, 0.1)' : isLow ? 'rgba(255, 193, 7, 0.05)' : 'transparent'
                    }}>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          background: idx === 0 ? 'rgba(165, 94, 234, 0.3)' : idx < 3 ? 'rgba(165, 94, 234, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                          color: idx === 0 ? '#a55eea' : idx < 3 ? '#c084fc' : '#888',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{color.name}</span>
                          <button
                            className="qty-btn"
                            onClick={() => {
                              setEditingColor(color.name);
                              setNewColorName(color.name);
                            }}
                            title="Edit color"
                            style={{ width: '24px', height: '24px', minWidth: '24px' }}
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#00ccff' }}>
                        {color.quantity.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#888' }}>
                        {color.orderCount}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#00ff88' }}>
                        {color.filamentWeight > 0 ? `${color.filamentWeight.toFixed(0)}g` : '-'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#ffc107' }}>
                        ${color.revenue.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                        {inventory > 0 ? `${inventory.toFixed(0)}g` : <span style={{ color: '#666' }}>-</span>}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
                        {usageRate ? (
                          <span style={{ color: '#00ccff' }}>{usageRate.weekly.toFixed(0)}g/wk</span>
                        ) : (
                          <span style={{ color: '#666' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                        {daysUntilReorder !== null ? (
                          <span style={{
                            color: isCritical ? '#ff6b6b' : isLow ? '#ffc107' : '#00ff88',
                            fontWeight: isCritical || isLow ? '600' : '400'
                          }}>
                            {daysUntilReorder === 0 ? 'Now!' : `${daysUntilReorder} days`}
                          </span>
                        ) : (
                          <span style={{ color: '#666' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage History Info */}
      <div style={{
        marginTop: '24px',
        background: 'rgba(0, 204, 255, 0.05)',
        border: '1px solid rgba(0, 204, 255, 0.2)',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertCircle size={18} style={{ color: '#00ccff' }} />
          <strong style={{ color: '#00ccff' }}>About Usage Rates & Reorder Predictions</strong>
        </div>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
          Usage rates and reorder predictions are calculated from filament deductions when orders are fulfilled.
          The more orders you process, the more accurate these predictions become.
          {(filamentUsageHistory || []).length > 0 ? (
            <span style={{ color: '#00ff88' }}> Currently tracking {(filamentUsageHistory || []).length} usage events.</span>
          ) : (
            <span> No usage history recorded yet - fulfill some orders to start tracking.</span>
          )}
        </p>
      </div>

      {/* Edit Color Modal */}
      {editingColor && (
        <div className="modal-overlay" onClick={() => setEditingColor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Color</h2>
              <button className="modal-close" onClick={() => setEditingColor(null)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(165, 94, 234, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <span style={{ color: '#888' }}>Current color: </span>
                <span style={{ color: '#a55eea', fontWeight: '600', textTransform: 'capitalize' }}>{editingColor}</span>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                  This will update all orders with this color
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>
                  New Color Name
                </label>
                <input
                  type="text"
                  className="add-item-input"
                  value={newColorName}
                  onChange={e => setNewColorName(e.target.value)}
                  placeholder="Enter new color name"
                  style={{ width: '100%', padding: '12px' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  onClick={renameColor}
                  style={{ flex: 1 }}
                  disabled={!newColorName.trim() || newColorName.toLowerCase() === editingColor.toLowerCase()}
                >
                  <Save size={16} /> Rename Color
                </button>
              </div>

              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '16px',
                marginTop: '8px'
              }}>
                <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '12px' }}>
                  Not a real color? Remove it from all orders:
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={clearColor}
                  style={{ width: '100%', color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.3)' }}
                >
                  <Trash2 size={16} /> Clear This Color
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
  const [printers, setPrinters] = useState(DEFAULT_PRINTERS);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [notification, setNotification] = useState(null);
  const [csvInput, setCsvInput] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const [importStoreId, setImportStoreId] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [modelsLoadedSuccessfully, setModelsLoadedSuccessfully] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [filamentUsageHistory, setFilamentUsageHistory] = useState([]);
  const [fulfillmentPartPrompt, setFulfillmentPartPrompt] = useState(null); // {orderId, modelName, availableParts}
  const [selectedFulfillmentParts, setSelectedFulfillmentParts] = useState({}); // {partName: quantity}
  const [subscriptions, setSubscriptions] = useState([]);

  // Helper function to parse color field
  const parseColorField = (colorField) => {
    const colorValues = ['sage', 'charcoal', 'navy', 'teal', 'cyan', 'magenta', 'beige', 'cream', 'ivory', 'tan', 'maroon', 'burgundy', 'olive', 'lime', 'coral', 'salmon', 'turquoise', 'indigo', 'violet', 'lavender', 'mint', 'peach', 'rose', 'bronze', 'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey', 'gold', 'silver', 'natural', 'wood', 'clear', 'transparent', 'multicolor', 'rainbow'];
    const skipLabels = ['color', 'size', 'tray color', 'stand color', 'amount', 'personalization', 'style', 'type', 'quantity', 'power type', 'n/a', 'none'];

    const parts = colorField.split(',').map(p => p.trim()).filter(p => p);
    let extractedColor = '';
    const extraParts = [];

    console.log('parseColorField input:', colorField);
    console.log('parseColorField parts:', parts);

    for (const part of parts) {
      const lowerPart = part.toLowerCase();

      // Skip field labels and "not requested" variations
      if (skipLabels.some(label => lowerPart === label) ||
          lowerPart.startsWith('not requested') ||
          lowerPart === 'not applicable') {
        console.log('Skipping:', part);
        continue;
      }

      let isColor = false;
      if (!extractedColor) {
        for (const color of colorValues) {
          if (lowerPart === color || lowerPart.includes(color)) {
            extractedColor = part;
            isColor = true;
            console.log('Found color:', part);
            break;
          }
        }
      }

      if (!isColor) {
        console.log('Adding to extra:', part);
        extraParts.push(part);
      }
    }

    console.log('parseColorField result - color:', extractedColor, 'extra:', extraParts);
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
        // Tab-separated WITHOUT headers - columns are: TXN, Product, Qty, Variations, Price, Tax
        console.log('Format: TAB-separated WITHOUT headers');

        const firstRow = lines[0].split('\t').map(v => v.trim());
        console.log('First row values:', firstRow);

        const transactionId = firstRow[0] || '';
        const product = firstRow[1] || '';
        const quantity = parseInt(firstRow[2]) || 1;
        const colorField = firstRow[3] || '';
        const price = firstRow[4] || '$0';
        const taxStr = firstRow[5] || '0';
        const salesTax = parseFloat(taxStr.replace(/[^0-9.]/g, '')) || 0;

        const { extractedColor, extractedExtra } = parseColorField(colorField);

        setCsvPreview({
          rowCount: lines.length,
          format: 'TAB (no headers)',
          transactionId,
          extractedProduct: product,
          extractedQuantity: quantity,
          extractedColor,
          extractedExtra,
          colorField,
          price,
          salesTax
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
        const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('total') || h.includes('amount'));
        const taxIdx = headers.findIndex(h => h.includes('tax') || h.includes('sales tax'));

        const firstRowValues = lines[1].split(delimiter).map(v => v.trim());

        const transactionId = txnIdx >= 0 ? firstRowValues[txnIdx] : '';
        const product = productIdx >= 0 ? firstRowValues[productIdx] : '';
        const quantity = qtyIdx >= 0 ? parseInt(firstRowValues[qtyIdx]) || 1 : 1;
        const colorField = colorIdx >= 0 ? firstRowValues[colorIdx] : '';
        const price = priceIdx >= 0 ? firstRowValues[priceIdx] : '$0';
        const taxStr = taxIdx >= 0 ? firstRowValues[taxIdx] : '0';
        const salesTax = parseFloat(taxStr.replace(/[^0-9.]/g, '')) || 0;

        const { extractedColor, extractedExtra } = parseColorField(colorField);

        setCsvPreview({
          rowCount: lines.length - 1,
          format: 'CSV',
          transactionId,
          extractedProduct: product,
          extractedQuantity: quantity,
          extractedColor,
          extractedExtra,
          colorField,
          price,
          salesTax
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
          colorField: '',
          price: '$0',
          salesTax: 0
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
        { data: ordersData, error: ordersError },
        { data: archivedData, error: archivedError },
        { data: filamentsData, error: filamentsError },
        { data: modelsData, error: modelsError },
        { data: partsData, error: partsError },
        { data: categoriesData, error: categoriesError },
        { data: teamData, error: teamError },
        { data: storesData, error: storesError },
        { data: printersData, error: printersError },
        { data: purchasesData, error: purchasesError },
        { data: usageHistoryData, error: usageHistoryError },
        { data: subscriptionsData, error: subscriptionsError }
      ] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('archived_orders').select('*'),
        supabase.from('filaments').select('*'),
        supabase.from('models').select('*'),
        supabase.from('external_parts').select('*'),
        supabase.from('supply_categories').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('stores').select('*'),
        supabase.from('printers').select('*'),
        supabase.from('purchases').select('*'),
        supabase.from('filament_usage_history').select('*'),
        supabase.from('subscriptions').select('*')
      ]);

      // Log any errors
      if (modelsError) console.error('Error loading models:', modelsError);
      if (ordersError) console.error('Error loading orders:', ordersError);

      console.log('Orders from Supabase:', ordersData?.length || 0);
      console.log('Models from Supabase:', modelsData?.length || 0, 'Error:', modelsError);

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
          scheduledStart: o.scheduled_start,
          printerId: o.printer_id,
          shippingCost: o.shipping_cost,
          productionStage: o.production_stage,
          salesTax: o.sales_tax,
          isReplacement: o.is_replacement || false,
          originalOrderId: o.original_order_id,
          materialCost: o.material_cost || 0,
          filamentUsed: o.filament_used || 0,
          modelId: o.model_id,
          isExtraPrint: o.is_extra_print || false,
          extraPrintFilament: o.extra_print_filament || 0,
          extraPrintMinutes: o.extra_print_minutes || 0,
          additionalColors: o.additional_colors || [],
          completedPlates: o.completed_plates || [],
          plateColors: o.plate_colors || {},
          plateReprints: o.plate_reprints || [],
          buyerMessage: o.buyer_message || '',
          assignmentIssue: o.assignment_issue || null,
          usedExternalPart: o.used_external_part || null,
          usedExternalParts: o.used_external_parts || {},
          overrideShipByDate: o.override_ship_by_date || null,
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
          shippingCost: o.shipping_cost,
          isHistorical: o.is_historical || false,
          salesTax: o.sales_tax,
          materialCost: o.material_cost || 0,
          filamentUsed: o.filament_used || 0,
          modelId: o.model_id,
          id: o.id
        }));
        setArchivedOrders(transformedArchived);
      }

      // Transform filaments: flat array -> object keyed by member_id
      if (filamentsData) {
        const filamentsObj = {};
        filamentsData.forEach(f => {
          if (!filamentsObj[f.member_id]) filamentsObj[f.member_id] = [];
          // Handle migration from old structure (rolls count) to new (backupRolls array)
          let backupRolls = f.backup_rolls || [];
          // If old rolls count exists but no backupRolls, create placeholder entries
          if (f.rolls > 0 && (!backupRolls || backupRolls.length === 0)) {
            backupRolls = Array.from({ length: f.rolls }, (_, i) => ({
              id: `migrated-${f.id}-${i}`,
              cost: f.cost_per_roll || 0,
              addedAt: Date.now()
            }));
          }
          filamentsObj[f.member_id].push({
            id: f.id,
            color: f.color,
            colorHex: f.color_hex,
            amount: f.amount,
            currentRollCost: f.current_roll_cost ?? f.cost_per_roll ?? 0,
            backupRolls: backupRolls,
            reorderAt: f.reorder_at ?? 250
          });
        });
        setFilaments(filamentsObj);
      }

      // Transform models
      if (modelsData !== null && modelsData !== undefined) {
        console.log('Raw models from Supabase:', modelsData.length, modelsData);
        const transformedModels = modelsData.map(m => ({
          id: m.id,
          name: m.name,
          variantName: m.variant_name || '',
          filamentUsage: m.filament_usage,
          defaultColor: m.default_color,
          externalParts: m.external_parts || [],
          storeId: m.store_id,
          imageUrl: m.image_url || '',
          printDuration: m.print_duration || null,
          printerSettings: m.printer_settings || [],
          aliases: m.aliases || [],
          file3mfUrl: m.file_3mf_url || '',
          folder: m.folder || 'Uncategorized',
          processingDays: m.processing_days || 3,
          stockCount: m.stock_count ?? null
        }));
        console.log('Transformed models:', transformedModels.length, transformedModels);
        setModels(transformedModels);
        setModelsLoadedSuccessfully(true);
      } else {
        console.log('No models data received from Supabase - NOT clearing local models');
        // Don't clear models if load failed - keep existing
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
            reorderAt: p.reorder_at,
            costPerUnit: p.cost_per_unit || 0
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
      if (printersData && printersData.length > 0) {
        setPrinters(printersData.map(p => ({
          id: p.id,
          name: p.name,
          totalHours: p.total_hours || 0,
          ownerId: p.owner_id || null,
          monthlyPayment: p.monthly_payment || 0,
          totalPrice: p.total_price || 0,
          remainingBalance: p.remaining_balance || 0,
          paymentStartDate: p.payment_start_date || null,
          isPaidOff: p.is_paid_off || false
        })));
      }

      // Transform purchases
      if (purchasesData) {
        const transformedPurchases = purchasesData.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          totalCost: p.total_cost,
          quantity: p.quantity,
          unitCost: p.unit_cost,
          supplier: p.supplier,
          purchaseDate: p.purchase_date,
          notes: p.notes,
          createdAt: p.created_at
        }));
        setPurchases(transformedPurchases);
      }

      // Transform filament usage history
      if (usageHistoryData) {
        const transformedHistory = usageHistoryData.map(h => ({
          id: h.id,
          color: h.color,
          amount: h.amount,
          date: h.date,
          orderId: h.order_id,
          memberId: h.member_id,
          modelName: h.model_name
        }));
        setFilamentUsageHistory(transformedHistory);
      }

      // Transform subscriptions
      if (subscriptionsData) {
        const transformedSubs = subscriptionsData.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          frequency: s.frequency,
          url: s.url,
          notes: s.notes,
          createdAt: s.created_at
        }));
        setSubscriptions(transformedSubs);
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
  const prevPrintersRef = useRef(null);
  const prevPartsRef = useRef(null);
  const prevTeamRef = useRef(null);
  const prevCategoriesRef = useRef(null);
  const prevPurchasesRef = useRef(null);
  const prevUsageHistoryRef = useRef(null);
  const prevSubscriptionsRef = useRef(null);

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
      try {
        // Get current DB orders
        const { data: dbOrders, error: fetchError } = await supabase.from('orders').select('id');
        if (fetchError) {
          console.error('Error fetching orders:', fetchError);
          return;
        }
        const dbIds = new Set(dbOrders?.map(o => o.id) || []);
        const currentIds = new Set(orders.map(o => o.id || o.orderId));

        // Delete removed orders
        const toDelete = [...dbIds].filter(id => !currentIds.has(id));
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase.from('orders').delete().in('id', toDelete);
          if (deleteError) console.error('Error deleting orders:', deleteError);
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
            assigned_to: o.assignedTo || null,
            notes: o.notes,
            store_id: o.storeId || null,
            shipped_at: o.shippedAt || null,
            fulfilled_at: o.fulfilledAt || null,
            created_at: o.createdAt,
            scheduled_start: o.scheduledStart || null,
            printer_id: o.printerId || null,
            shipping_cost: o.shippingCost,
            production_stage: o.productionStage,
            sales_tax: o.salesTax,
            is_replacement: o.isReplacement || false,
            original_order_id: o.originalOrderId,
            material_cost: o.materialCost || 0,
            filament_used: o.filamentUsed || 0,
            model_id: o.modelId,
            is_extra_print: o.isExtraPrint || false,
            extra_print_filament: o.extraPrintFilament || 0,
            extra_print_minutes: o.extraPrintMinutes || 0,
            additional_colors: o.additionalColors || [],
            completed_plates: o.completedPlates || [],
            plate_colors: o.plateColors || {},
            plate_reprints: o.plateReprints || [],
            buyer_message: o.buyerMessage || '',
            assignment_issue: o.assignmentIssue || null,
            used_external_part: o.usedExternalPart || null,
            used_external_parts: o.usedExternalParts || {},
            override_ship_by_date: o.overrideShipByDate || null
          }));
          const { error: upsertError } = await supabase.from('orders').upsert(dbFormat);
          if (upsertError) {
            console.error('Error saving orders:', upsertError);
            // Show user-visible error
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#ff4444;color:white;padding:12px 20px;border-radius:8px;z-index:99999;font-weight:500;';
            errorDiv.textContent = `Save failed: ${upsertError.message}`;
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
          }
        }
      } catch (e) {
        console.error('Sync orders error:', e);
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
          color: o.color || '',
          extra: o.extra || '',
          price: o.price,
          address: o.address,
          status: o.status,
          assigned_to: o.assignedTo || null,
          notes: o.notes,
          store_id: o.storeId || null,
          shipped_at: o.shippedAt || null,
          fulfilled_at: o.fulfilledAt || null,
          created_at: o.createdAt || Date.now(),
          archived_at: o.archivedAt || Date.now(),
          shipping_cost: o.shippingCost,
          is_historical: o.isHistorical || false,
          sales_tax: o.salesTax,
          material_cost: o.materialCost || 0,
          filament_used: o.filamentUsed || 0,
          model_id: o.modelId
        }));
        console.log('Saving archived orders:', dbFormat);
        const { error } = await supabase.from('archived_orders').upsert(dbFormat);
        if (error) {
          console.error('Error saving archived orders:', error);
        }
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
            current_roll_cost: f.currentRollCost || 0,
            backup_rolls: f.backupRolls || [],
            rolls: (f.backupRolls || []).length, // Keep for backwards compatibility
            cost_per_roll: f.currentRollCost || 0, // Keep for backwards compatibility
            reorder_at: f.reorderAt ?? 250
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
        const { error } = await supabase.from('filaments').upsert(allFilaments);
        if (error) {
          console.error('Error saving filaments:', error);
          // Show user-visible error
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#ff4444;color:white;padding:12px 20px;border-radius:8px;z-index:99999;font-weight:500;max-width:400px;';
          errorDiv.textContent = `Filament save failed: ${error.message}`;
          document.body.appendChild(errorDiv);
          setTimeout(() => errorDiv.remove(), 5000);
        } else {
          console.log('Filaments saved successfully:', allFilaments.length);
        }
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
      try {
        const { data: dbModels, error: fetchError } = await supabase.from('models').select('id');
        if (fetchError) {
          console.error('Error fetching models:', fetchError);
          return;
        }
        const dbIds = new Set(dbModels?.map(m => m.id) || []);
        const currentIds = new Set(models.map(m => m.id));

        // Only delete if models loaded successfully AND we have local models
        // This prevents accidental deletion when load fails
        const toDelete = [...dbIds].filter(id => !currentIds.has(id));
        if (toDelete.length > 0 && modelsLoadedSuccessfully && models.length > 0) {
          const { error: deleteError } = await supabase.from('models').delete().in('id', toDelete);
          if (deleteError) console.error('Error deleting models:', deleteError);
        } else if (toDelete.length > 0 && models.length === 0) {
          console.log('Skipping model deletion - local models empty, might be load error');
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
            image_url: m.imageUrl,
            print_duration: m.printDuration,
            printer_settings: m.printerSettings,
            aliases: m.aliases || [],
            folder: m.folder || 'Uncategorized',
            processing_days: m.processingDays || 3,
            stock_count: m.stockCount ?? null
          }));
          const { error: upsertError } = await supabase.from('models').upsert(dbFormat);
          if (upsertError) {
            console.error('Error saving models:', upsertError);
            // Show user-visible error
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#ff4444;color:white;padding:12px 20px;border-radius:8px;z-index:99999;font-weight:500;max-width:400px;';
            errorDiv.textContent = `Model save failed: ${upsertError.message}`;
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
          } else {
            console.log('Models saved successfully:', models.length);
          }
        }
      } catch (e) {
        console.error('Sync models error:', e);
      }
    };
    syncModels();
  }, [models, initialLoadComplete, modelsLoadedSuccessfully]);

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
      prevPrintersRef.current = printers;
      return;
    }
    if (JSON.stringify(printers) === JSON.stringify(prevPrintersRef.current)) return;
    prevPrintersRef.current = printers;

    const syncPrinters = async () => {
      const { data: dbPrinters } = await supabase.from('printers').select('id');
      const dbIds = new Set(dbPrinters?.map(p => p.id) || []);
      const currentIds = new Set(printers.map(p => p.id));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('printers').delete().in('id', toDelete);
      }

      if (printers.length > 0) {
        const dbFormat = printers.map(p => ({
          id: p.id,
          name: p.name,
          total_hours: p.totalHours || 0,
          owner_id: p.ownerId || null,
          monthly_payment: p.monthlyPayment || 0,
          total_price: p.totalPrice || 0,
          remaining_balance: p.remainingBalance || 0,
          payment_start_date: p.paymentStartDate || null,
          is_paid_off: p.isPaidOff || false
        }));
        await supabase.from('printers').upsert(dbFormat);
      }
    };
    syncPrinters();
  }, [printers, initialLoadComplete]);

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
            reorder_at: p.reorderAt,
            cost_per_unit: p.costPerUnit || 0
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

  useEffect(() => {
    if (!initialLoadComplete) {
      prevPurchasesRef.current = purchases;
      return;
    }
    if (JSON.stringify(purchases) === JSON.stringify(prevPurchasesRef.current)) return;
    prevPurchasesRef.current = purchases;

    const syncPurchases = async () => {
      const { data: dbPurchases } = await supabase.from('purchases').select('id');
      const dbIds = new Set(dbPurchases?.map(p => p.id) || []);
      const currentIds = new Set(purchases.map(p => p.id));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('purchases').delete().in('id', toDelete);
      }

      if (purchases.length > 0) {
        const dbFormat = purchases.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          total_cost: p.totalCost,
          quantity: p.quantity,
          unit_cost: p.unitCost,
          supplier: p.supplier,
          purchase_date: p.purchaseDate,
          notes: p.notes,
          created_at: p.createdAt
        }));
        await supabase.from('purchases').upsert(dbFormat);
      }
    };
    syncPurchases();
  }, [purchases, initialLoadComplete]);

  // Auto-save filament usage history
  useEffect(() => {
    if (!initialLoadComplete) {
      prevUsageHistoryRef.current = filamentUsageHistory;
      return;
    }
    if (JSON.stringify(filamentUsageHistory) === JSON.stringify(prevUsageHistoryRef.current)) return;
    prevUsageHistoryRef.current = filamentUsageHistory;

    const syncUsageHistory = async () => {
      // Only insert new records, don't delete (history should be preserved)
      if (filamentUsageHistory.length > 0) {
        const dbFormat = filamentUsageHistory.map(h => ({
          id: h.id,
          color: h.color,
          amount: h.amount,
          date: h.date,
          order_id: h.orderId,
          member_id: h.memberId,
          model_name: h.modelName
        }));
        const { error } = await supabase.from('filament_usage_history').upsert(dbFormat);
        if (error) {
          console.error('Error saving usage history:', error);
        }
      }
    };
    syncUsageHistory();
  }, [filamentUsageHistory, initialLoadComplete]);

  // Auto-save subscriptions
  useEffect(() => {
    if (!initialLoadComplete) {
      prevSubscriptionsRef.current = subscriptions;
      return;
    }
    if (JSON.stringify(subscriptions) === JSON.stringify(prevSubscriptionsRef.current)) return;
    prevSubscriptionsRef.current = subscriptions;

    const syncSubscriptions = async () => {
      const { data: dbSubs } = await supabase.from('subscriptions').select('id');
      const dbIds = new Set(dbSubs?.map(s => s.id) || []);
      const currentIds = new Set(subscriptions.map(s => s.id));

      const toDelete = [...dbIds].filter(id => !currentIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('subscriptions').delete().in('id', toDelete);
      }

      if (subscriptions.length > 0) {
        const dbFormat = subscriptions.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          frequency: s.frequency,
          url: s.url,
          notes: s.notes,
          created_at: s.createdAt
        }));
        const { error } = await supabase.from('subscriptions').upsert(dbFormat);
        if (error) {
          console.error('Error saving subscriptions:', error);
        }
      }
    };
    syncSubscriptions();
  }, [subscriptions, initialLoadComplete]);

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

  // Calculate material cost for an order based on model and filament data
  const calculateMaterialCost = (order, model, allFilaments, allExternalParts = {}) => {
    let totalCost = 0;

    // Calculate filament cost
    if (model) {
      const printerSettings = model.printerSettings?.find(ps => ps.printerId === order.printerId) || model.printerSettings?.[0];
      let filamentUsage = 0;
      if (printerSettings?.plates?.length > 0) {
        filamentUsage = printerSettings.plates.reduce((sum, plate) =>
          sum + (parseFloat(plate.filamentUsage) || 0), 0);
      } else if (model.filamentUsage) {
        filamentUsage = parseFloat(model.filamentUsage) || 0;
      }

      if (filamentUsage > 0) {
        const orderColor = (order.color || model.defaultColor || '').toLowerCase().trim();
        let costPerGram = 0;

        Object.values(allFilaments).forEach(memberFilaments => {
          memberFilaments.forEach(fil => {
            const filColor = fil.color.toLowerCase().trim();
            if (filColor === orderColor || filColor.includes(orderColor) || orderColor.includes(filColor)) {
              const rollCost = fil.currentRollCost || fil.costPerRoll || 0;
              if (rollCost > 0) {
                costPerGram = rollCost / 1000;
              }
            }
          });
        });

        totalCost += filamentUsage * (order.quantity || 1) * costPerGram;
      }
    }

    // Calculate external parts cost
    const memberParts = order.assignedTo ? (allExternalParts[order.assignedTo] || []) : [];

    // Get parts from model definition
    if (model?.externalParts?.length > 0) {
      model.externalParts.forEach(modelPart => {
        const inventoryPart = memberParts.find(p =>
          p.name.toLowerCase() === modelPart.name.toLowerCase()
        );
        const costPerUnit = inventoryPart?.costPerUnit || 0;
        const qtyNeeded = modelPart.quantity || 1;
        totalCost += costPerUnit * qtyNeeded * (order.quantity || 1);
      });
    }

    // Get parts from user selection during fulfillment (usedExternalParts)
    if (order.usedExternalParts && typeof order.usedExternalParts === 'object') {
      Object.entries(order.usedExternalParts).forEach(([partName, qty]) => {
        if (qty > 0) {
          const inventoryPart = memberParts.find(p =>
            p.name.toLowerCase() === partName.toLowerCase()
          );
          const costPerUnit = inventoryPart?.costPerUnit || 0;
          totalCost += costPerUnit * qty;
        }
      });
    }

    return totalCost;
  };

  // Find model by order item name
  const findModelForOrder = (order, modelsList) => {
    const orderItem = (order.item || '').toLowerCase();
    return modelsList.find(m => {
      const modelName = m.name.toLowerCase();
      if (orderItem.includes(modelName) || modelName.includes(orderItem)) return true;
      if (m.aliases?.some(alias => orderItem.includes(alias.toLowerCase()))) return true;
      return false;
    });
  };

  // Recalculate material costs for all orders based on current models
  const recalculateOrderCosts = (modelsList) => {
    // Update active orders
    const updatedOrders = orders.map(order => {
      const model = findModelForOrder(order, modelsList);
      const materialCost = calculateMaterialCost(order, model, filaments, externalParts);

      // Calculate filament used for display
      let filamentUsed = 0;
      if (model) {
        const printerSettings = model.printerSettings?.find(ps => ps.printerId === order.printerId) || model.printerSettings?.[0];
        if (printerSettings?.plates?.length > 0) {
          filamentUsed = printerSettings.plates.reduce((sum, plate) =>
            sum + (parseFloat(plate.filamentUsage) || 0), 0);
        } else if (model.filamentUsage) {
          filamentUsed = parseFloat(model.filamentUsage) || 0;
        }
        filamentUsed *= (order.quantity || 1);
      }

      return {
        ...order,
        materialCost: materialCost,
        filamentUsed: filamentUsed,
        modelId: model?.id || null
      };
    });

    // Update archived orders (for analytics only - no filament deduction)
    const updatedArchived = archivedOrders.map(order => {
      const model = findModelForOrder(order, modelsList);
      const materialCost = calculateMaterialCost(order, model, filaments, externalParts);

      let filamentUsed = 0;
      if (model) {
        const printerSettings = model.printerSettings?.find(ps => ps.printerId === order.printerId) || model.printerSettings?.[0];
        if (printerSettings?.plates?.length > 0) {
          filamentUsed = printerSettings.plates.reduce((sum, plate) =>
            sum + (parseFloat(plate.filamentUsage) || 0), 0);
        } else if (model.filamentUsage) {
          filamentUsed = parseFloat(model.filamentUsage) || 0;
        }
        filamentUsed *= (order.quantity || 1);
      }

      return {
        ...order,
        materialCost: materialCost,
        filamentUsed: filamentUsed,
        modelId: model?.id || null
      };
    });

    setOrders(updatedOrders);
    setArchivedOrders(updatedArchived);
  };

  const saveModels = async (newModels) => {
    setModels(newModels);
    // Recalculate costs for all orders when models change
    recalculateOrderCosts(newModels);
  };

  const saveStores = async (newStores) => {
    setStores(newStores);
  };

  const savePrinters = async (newPrinters) => {
    setPrinters(newPrinters);
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

  const savePurchases = async (newPurchases) => {
    setPurchases(newPurchases);
  };

  const saveSubscriptions = async (newSubscriptions) => {
    setSubscriptions(newSubscriptions);
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

  // Helper function to find a model by name or alias
  const findModelByName = (itemName) => {
    if (!itemName) return null;
    const lowerItem = itemName.toLowerCase();
    return models.find(m => {
      // Check main name
      if (m.name.toLowerCase() === lowerItem) return true;
      // Check if item contains model name or vice versa
      if (m.name.toLowerCase().includes(lowerItem) || lowerItem.includes(m.name.toLowerCase())) return true;
      // Check aliases
      if (m.aliases && m.aliases.length > 0) {
        return m.aliases.some(alias => {
          const lowerAlias = alias.toLowerCase();
          return lowerAlias === lowerItem ||
                 lowerAlias.includes(lowerItem) ||
                 lowerItem.includes(lowerAlias);
        });
      }
      return false;
    });
  };

  // Enhanced model matching that considers external parts from order's "extra" field
  // Match order to best model variant based on Extra field
  // Priority: 1) variantName match, 2) external part match, 3) base model
  const findBestModelMatch = (itemName, extra) => {
    if (!itemName) return null;
    const lowerItem = itemName.toLowerCase();
    const lowerExtra = (extra || '').toLowerCase().trim();

    // Helper to check if a model matches the item name
    const matchesName = (m) => {
      if (m.name.toLowerCase() === lowerItem) return true;
      if (m.name.toLowerCase().includes(lowerItem) || lowerItem.includes(m.name.toLowerCase())) return true;
      if (m.aliases && m.aliases.length > 0) {
        return m.aliases.some(alias => {
          const lowerAlias = alias.toLowerCase();
          return lowerAlias === lowerItem || lowerAlias.includes(lowerItem) || lowerItem.includes(lowerAlias);
        });
      }
      return false;
    };

    // Get all models that match the item name
    const matchingModels = models.filter(matchesName);
    if (matchingModels.length === 0) return null;
    if (matchingModels.length === 1) return matchingModels[0];

    // If there's an extra field, try to find a matching variant
    if (lowerExtra) {
      // First, try to match by variantName (e.g., "Small", "Large", "LED Plug-In")
      const variantByName = matchingModels.find(m => {
        if (!m.variantName) return false;
        const variantLower = m.variantName.toLowerCase();
        return variantLower === lowerExtra ||
               variantLower.includes(lowerExtra) ||
               lowerExtra.includes(variantLower);
      });
      if (variantByName) return variantByName;

      // Then, try to match by external part name
      const variantWithPart = matchingModels.find(m => {
        if (!m.externalParts || m.externalParts.length === 0) return false;
        return m.externalParts.some(part => {
          const partName = part.name.toLowerCase();
          return partName.includes(lowerExtra) || lowerExtra.includes(partName);
        });
      });
      if (variantWithPart) return variantWithPart;
    }

    // Fall back to the base model (no variant name and no external parts) or first match
    const baseModel = matchingModels.find(m =>
      (!m.variantName || m.variantName === '') &&
      (!m.externalParts || m.externalParts.length === 0)
    );
    return baseModel || matchingModels[0];
  };

  // Auto-assignment algorithm with external parts matching
  const autoAssignOrder = (order, currentOrders) => {
    const model = findModelByName(order.item);
    if (!model) return { assignedTo: null, assignmentIssue: null };

    const orderExtra = (order.extra || '').toLowerCase().trim();

    // Check if there are other orders from the same buyer with an existing assignment
    // If so, prefer assigning to the same team member to keep orders together
    const buyerName = (order.buyerName || '').toLowerCase().trim();
    if (buyerName) {
      const sameBuyerOrder = currentOrders.find(o =>
        (o.buyerName || '').toLowerCase().trim() === buyerName &&
        o.assignedTo &&
        o.status !== 'shipped'
      );
      if (sameBuyerOrder) {
        // Check if the existing assignee can handle this order (has required parts/filament)
        const existingAssignee = sameBuyerOrder.assignedTo;
        const memberParts = externalParts[existingAssignee] || [];
        const memberFilaments = filaments[existingAssignee] || [];

        let canHandle = true;

        // Check external parts if needed
        if (orderExtra && model.externalParts?.length > 0) {
          const requiredPart = model.externalParts.find(part => {
            const partName = part.name.toLowerCase();
            return partName.includes(orderExtra) || orderExtra.includes(partName);
          });
          if (requiredPart) {
            const memberPart = memberParts.find(p => {
              const pName = p.name.toLowerCase();
              const rName = requiredPart.name.toLowerCase();
              return pName === rName || pName.includes(rName) || rName.includes(pName);
            });
            if (!memberPart || memberPart.quantity < (requiredPart.quantity || 1)) {
              canHandle = false;
            }
          }
        }

        // Check filament availability
        if (canHandle) {
          const orderColor = (order.color || model.defaultColor || '').toLowerCase();
          const neededFilament = memberFilaments.find(f => {
            const filColor = f.color.toLowerCase();
            return filColor === orderColor ||
                   filColor.includes(orderColor) ||
                   orderColor.includes(filColor);
          });
          if (!neededFilament || neededFilament.remaining < (model.filamentUsage || 0)) {
            // Low filament but don't block - just prefer others
          }
        }

        if (canHandle) {
          // Assign to the same person as other orders from this buyer
          return { assignedTo: existingAssignee, assignmentIssue: null };
        }
      }
    }

    // Find which external part is needed based on the order's "extra" field (partial match)
    let requiredPart = null;
    if (orderExtra && model.externalParts?.length > 0) {
      requiredPart = model.externalParts.find(part => {
        const partName = part.name.toLowerCase();
        // Partial match: either extra contains part name or part name contains extra
        return partName.includes(orderExtra) || orderExtra.includes(partName);
      });
    }

    const scores = teamMembers.map(member => {
      let score = 0;
      const memberParts = externalParts[member.id] || [];
      const memberFilaments = filaments[member.id] || [];

      // Count current workload (fewer orders = higher priority for tie-breaking)
      const memberOrders = currentOrders.filter(o =>
        o.assignedTo === member.id && o.status !== 'shipped'
      ).length;

      // If a specific external part is required, prioritize by stock of that part
      let partStock = 0;
      let hasRequiredPart = false;
      if (requiredPart) {
        const memberPart = memberParts.find(p => {
          const pName = p.name.toLowerCase();
          const rName = requiredPart.name.toLowerCase();
          return pName === rName || pName.includes(rName) || rName.includes(pName);
        });
        if (memberPart && memberPart.quantity >= (requiredPart.quantity || 1)) {
          hasRequiredPart = true;
          partStock = memberPart.quantity;
          // Primary score: stock of the required part (weighted heavily)
          score += partStock * 10;
        }
      } else {
        // No specific part required, check all model parts
        let hasAllParts = true;
        (model.externalParts || []).forEach(needed => {
          const part = memberParts.find(p => p.name.toLowerCase() === needed.name.toLowerCase());
          if (!part || part.quantity < needed.quantity) {
            hasAllParts = false;
          } else {
            score += part.quantity;
          }
        });
        hasRequiredPart = hasAllParts || (model.externalParts || []).length === 0;
      }

      // Check filament availability
      const orderColor = (order.color || model.defaultColor || '').toLowerCase();
      const neededFilament = memberFilaments.find(f => {
        const filColor = f.color.toLowerCase();
        return filColor === orderColor ||
               filColor.includes(orderColor) ||
               orderColor.includes(filColor);
      });
      if (neededFilament) {
        const totalAvailable = neededFilament.amount + (neededFilament.backupRolls?.length || 0) * 1000;
        score += Math.min(totalAvailable / 100, 5); // Small bonus for filament
      }

      // Tie-breaker: fewer current orders = higher score
      score -= memberOrders * 0.5;

      return {
        memberId: member.id,
        memberName: member.name,
        score,
        hasRequiredPart,
        partStock,
        orderCount: memberOrders
      };
    });

    // Filter to only members who have the required part (if one is required)
    const eligibleMembers = requiredPart
      ? scores.filter(s => s.hasRequiredPart)
      : scores.filter(s => s.hasRequiredPart);

    // Sort by score (highest first), then by order count (lowest first) as tie-breaker
    eligibleMembers.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.orderCount - b.orderCount; // Fewer orders wins tie
    });

    // If no one has the required part, leave unassigned with issue
    if (eligibleMembers.length === 0 || (requiredPart && !eligibleMembers[0]?.hasRequiredPart)) {
      const partName = requiredPart?.name || 'required parts';
      return {
        assignedTo: null,
        assignmentIssue: `No stock: ${partName}`
      };
    }

    return {
      assignedTo: eligibleMembers[0]?.memberId || null,
      assignmentIssue: null
    };
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
        // Tab-separated WITHOUT headers - columns are: TXN, Product, Qty, Variations, Price, Tax, BuyerName, BuyerMessage, Timestamp
        console.log('Format: TAB-separated WITHOUT headers');

        for (let i = 0; i < lines.length; i++) {
          const values = lines[i].split('\t').map(v => v.trim());

          const transactionId = values[0] || '';
          const product = values[1] || 'Unknown Product';
          const quantity = parseInt(values[2]) || 1;
          const colorField = values[3] || '';
          const price = values[4] || '$0';
          // Parse tax - remove $ and parse as float
          const taxStr = values[5] || '0';
          const salesTax = parseFloat(taxStr.replace(/[^0-9.]/g, '')) || 0;
          const buyerName = values[6] || 'Unknown';
          const buyerMessage = values[7] || '';
          // Parse timestamp - ISO format like 2026-01-20T02:45:34.000Z
          const timestampStr = values[8] || '';
          const createdAt = timestampStr ? new Date(timestampStr).getTime() : Date.now();

          console.log(`Row ${i + 1}:`, { transactionId, product: product.substring(0, 40), quantity, colorField, price, salesTax, buyerName, timestampStr });

          if (!transactionId || !/^\d+$/.test(transactionId)) {
            console.log('Skipping invalid transaction ID');
            continue;
          }

          // Check existing orders, archived orders, AND orders being added in this batch
          if (orders.find(o => o.orderId === transactionId) ||
              archivedOrders.find(o => o.orderId === transactionId) ||
              newOrders.find(o => o.orderId === transactionId)) {
            duplicates++;
            continue;
          }

          const { extractedColor, extractedExtra } = parseColorField(colorField);

          newOrders.push({
            orderId: transactionId,
            buyerName: buyerName,
            item: product,
            quantity: quantity,
            color: extractedColor,
            extra: extractedExtra,
            price: price.startsWith('$') ? price : `$${price}`,
            address: '',
            status: 'received',
            assignedTo: null,
            createdAt: createdAt,
            notes: '',
            storeId: importStoreId && importStoreId !== '' ? importStoreId : null,
            salesTax: salesTax,
            buyerMessage: buyerMessage
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
        const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('total') || h.includes('amount'));
        const taxIdx = headers.findIndex(h => h.includes('tax') || h.includes('sales tax'));
        const buyerIdx = headers.findIndex(h => h.includes('buyer') || h.includes('customer') || h.includes('name'));
        const messageIdx = headers.findIndex(h => h.includes('message') || h.includes('note'));
        const timestampIdx = headers.findIndex(h => h.includes('timestamp') || h.includes('date') || h.includes('time'));

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
          const priceVal = priceIdx >= 0 ? values[priceIdx] : '$0';
          const taxStr = taxIdx >= 0 ? values[taxIdx] : '0';
          const salesTax = parseFloat(taxStr.replace(/[^0-9.]/g, '')) || 0;
          const buyerName = buyerIdx >= 0 ? values[buyerIdx] : 'Unknown';
          const buyerMessage = messageIdx >= 0 ? values[messageIdx] : '';
          const timestampStr = timestampIdx >= 0 ? values[timestampIdx] : '';
          const createdAt = timestampStr ? new Date(timestampStr).getTime() : Date.now();

          // Check existing orders, archived orders, AND orders being added in this batch
          if (orders.find(o => o.orderId === transactionId) ||
              archivedOrders.find(o => o.orderId === transactionId) ||
              newOrders.find(o => o.orderId === transactionId)) {
            duplicates++;
            continue;
          }

          const { extractedColor, extractedExtra } = parseColorField(colorField);

          newOrders.push({
            orderId: transactionId,
            buyerName: buyerName,
            item: product,
            quantity: quantity,
            color: extractedColor,
            extra: extractedExtra,
            price: priceVal.startsWith('$') ? priceVal : `$${priceVal}`,
            address: '',
            status: 'received',
            assignedTo: null,
            createdAt: createdAt,
            notes: '',
            storeId: importStoreId && importStoreId !== '' ? importStoreId : null,
            salesTax: salesTax,
            buyerMessage: buyerMessage
          });
        }
      }

      console.log('=== IMPORT COMPLETE ===');
      console.log('Store ID for import:', importStoreId);
      console.log('New orders:', newOrders.length);
      console.log('First order storeId:', newOrders[0]?.storeId);

      // Auto-assign orders based on external parts inventory
      const allOrders = [...orders];
      let unassignedCount = 0;
      newOrders.forEach(order => {
        const result = autoAssignOrder(order, [...allOrders, ...newOrders.filter(o => o !== order)]);
        order.assignedTo = result.assignedTo;
        order.assignmentIssue = result.assignmentIssue;
        if (result.assignmentIssue) {
          unassignedCount++;
        }
        allOrders.push(order);
      });

      saveOrders([...orders, ...newOrders]);

      // Decrease stock for matching models
      const stockUpdates = {};
      newOrders.forEach(order => {
        const model = findModelForOrder(order, models);
        if (model && model.stockCount !== null && model.stockCount !== undefined) {
          if (!stockUpdates[model.id]) {
            stockUpdates[model.id] = 0;
          }
          stockUpdates[model.id] += order.quantity || 1;
        }
      });

      // Update models with decreased stock
      if (Object.keys(stockUpdates).length > 0) {
        const updatedModels = models.map(m => {
          if (stockUpdates[m.id]) {
            const newStock = Math.max(0, (m.stockCount || 0) - stockUpdates[m.id]);
            return { ...m, stockCount: newStock };
          }
          return m;
        });
        saveModels(updatedModels);

        // Check for low stock models and notify
        const lowStockModels = updatedModels.filter(m => m.stockCount !== null && m.stockCount <= 3);
        if (lowStockModels.length > 0) {
          const lowStockNames = lowStockModels.map(m => `${m.name}${m.variantName ? ` (${m.variantName})` : ''}: ${m.stockCount}`).join(', ');
          showNotification(`Low stock alert: ${lowStockNames}`, 'warning');
        }
      }

      // Show notification with unassigned count if any
      if (unassignedCount > 0) {
        showNotification(`Imported ${newOrders.length} order${newOrders.length > 1 ? 's' : ''}. ${unassignedCount} unassigned (no stock). ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped.`, 'warning');
        return;
      }

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

  // Sync from Google Sheets
  const syncFromGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      showNotification('Please enter a Google Sheet URL', 'error');
      return;
    }

    setSyncingSheet(true);
    try {
      // Convert Google Sheet URL to CSV export URL
      // Format: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
      // To: https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=0
      let csvUrl = googleSheetUrl.trim();

      // Extract sheet ID and gid
      const sheetIdMatch = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = csvUrl.match(/gid=(\d+)/);

      if (!sheetIdMatch) {
        showNotification('Invalid Google Sheet URL. Make sure it looks like: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/...', 'error');
        setSyncingSheet(false);
        return;
      }

      const sheetId = sheetIdMatch[1];
      const gid = gidMatch ? gidMatch[1] : '0';
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      console.log('Fetching CSV from:', csvUrl);

      // Fetch the CSV
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet: ${response.status}. Make sure the sheet is shared as "Anyone with the link can view"`);
      }

      const csvText = await response.text();
      console.log('Received CSV:', csvText.substring(0, 200));

      // Parse CSV
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        showNotification('Sheet appears to be empty or has no data rows', 'error');
        setSyncingSheet(false);
        return;
      }

      // Parse header row
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      console.log('Headers:', headers);

      // Find column indices
      const txnIdx = headers.findIndex(h => h.includes('transaction') || h.includes('order') || h.includes('sale id') || h.includes('order id'));
      const productIdx = headers.findIndex(h => h.includes('product') || h.includes('item') || h.includes('title'));
      const qtyIdx = headers.findIndex(h => h.includes('quantity') || h.includes('qty'));
      const colorIdx = headers.findIndex(h => h.includes('variation') || h.includes('color'));
      const buyerIdx = headers.findIndex(h => h.includes('buyer') || h.includes('customer') || h.includes('name'));
      const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('total') || h.includes('amount'));
      const taxIdx = headers.findIndex(h => h.includes('tax') || h.includes('sales tax'));

      if (txnIdx === -1) {
        showNotification('Could not find Transaction/Order ID column. Make sure your sheet has a column with "Transaction" or "Order" in the header.', 'error');
        setSyncingSheet(false);
        return;
      }

      console.log('Column indices:', { txnIdx, productIdx, qtyIdx, colorIdx, buyerIdx, priceIdx, taxIdx });

      // Parse rows
      const newOrders = [];
      let duplicates = 0;

      for (let i = 1; i < lines.length; i++) {
        // Simple CSV parse (handles basic quoted fields)
        const values = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];

        const transactionId = txnIdx >= 0 ? values[txnIdx]?.trim() : '';
        if (!transactionId || !/^\d+$/.test(transactionId)) continue;

        // Check for duplicates
        if (orders.find(o => o.orderId === transactionId) ||
            archivedOrders.find(o => o.orderId === transactionId) ||
            newOrders.find(o => o.orderId === transactionId)) {
          duplicates++;
          continue;
        }

        const product = productIdx >= 0 ? values[productIdx]?.trim() || 'Unknown' : 'Unknown';
        const quantity = qtyIdx >= 0 ? parseInt(values[qtyIdx]) || 1 : 1;
        const colorField = colorIdx >= 0 ? values[colorIdx]?.trim() || '' : '';
        const buyerName = buyerIdx >= 0 ? values[buyerIdx]?.trim() || 'Unknown' : 'Unknown';
        const priceVal = priceIdx >= 0 ? values[priceIdx]?.trim() || '$0' : '$0';
        const taxStr = taxIdx >= 0 ? values[taxIdx]?.trim() || '0' : '0';
        const salesTax = parseFloat(taxStr.replace(/[^0-9.]/g, '')) || 0;

        const { extractedColor, extractedExtra } = parseColorField(colorField);

        newOrders.push({
          orderId: transactionId,
          buyerName: buyerName,
          item: product,
          quantity: quantity,
          color: extractedColor,
          extra: extractedExtra,
          price: priceVal.startsWith('$') ? priceVal : `$${priceVal}`,
          address: '',
          status: 'received',
          assignedTo: null,
          createdAt: Date.now(),
          notes: '',
          storeId: importStoreId || null,
          salesTax: salesTax
        });
      }

      if (newOrders.length === 0) {
        showNotification(`No new orders found. ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped.`);
        setSyncingSheet(false);
        return;
      }

      // Auto-assign orders
      const allOrders = [...orders];
      newOrders.forEach(order => {
        order.assignedTo = autoAssignOrder(order, [...allOrders, ...newOrders.filter(o => o !== order)]);
        allOrders.push(order);
      });

      saveOrders([...orders, ...newOrders]);
      showNotification(`Synced ${newOrders.length} new order${newOrders.length > 1 ? 's' : ''} from Google Sheets. ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped.`);

      // Save the URL to localStorage for next time
      localStorage.setItem('googleSheetUrl', googleSheetUrl);

    } catch (e) {
      console.error('Sync error:', e);
      showNotification('Sync failed: ' + e.message, 'error');
    }
    setSyncingSheet(false);
  };

  // Load saved Google Sheet URL on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetUrl');
    if (savedUrl) setGoogleSheetUrl(savedUrl);
  }, []);

  // Update order status
  const updateOrderStatus = (orderId, newStatus, shippingCost = null) => {
    const updated = orders.map(o => {
      if (o.orderId === orderId) {
        const updates = { status: newStatus };
        if (newStatus === 'shipped') {
          updates.shippedAt = Date.now();
          if (shippingCost !== null) {
            updates.shippingCost = parseFloat(shippingCost) || 0;
          }
        }
        if (newStatus === 'fulfilled') updates.fulfilledAt = Date.now();

        // Add back inventory when UN-fulfilling (changing from fulfilled to something else)
        if (o.status === 'fulfilled' && newStatus !== 'fulfilled' && o.assignedTo) {
          const ROLL_SIZE = 1000;
          const memberFilaments = [...(filaments[o.assignedTo] || [])];
          let filamentChanged = false;

          // Handle extra prints
          if (o.isExtraPrint && o.extraPrintFilament > 0) {
            const orderColor = (o.color || '').toLowerCase().trim();
            const filamentIdx = memberFilaments.findIndex(f => {
              const filColor = f.color.toLowerCase().trim();
              return filColor === orderColor ||
                     filColor.includes(orderColor) ||
                     orderColor.includes(filColor);
            });
            if (filamentIdx >= 0) {
              memberFilaments[filamentIdx] = {
                ...memberFilaments[filamentIdx],
                amount: memberFilaments[filamentIdx].amount + o.extraPrintFilament
              };
              filamentChanged = true;
              showNotification(`Added back ${o.extraPrintFilament.toFixed(2)}g of ${memberFilaments[filamentIdx].color}`);
            }
          } else {
            // Regular order - add back filament based on plates
            const model = findModelByName(o.item);
            if (model) {
              const printerSettings = model.printerSettings?.find(ps => ps.printerId === o.printerId) || model.printerSettings?.[0];
              const plates = printerSettings?.plates || [];
              const completedPlates = o.completedPlates || [];
              const plateColors = o.plateColors || {};
              const orderColor = o.color || model.defaultColor || '';

              // If plates were completed, add back filament for each plate
              if (plates.length > 0 && completedPlates.length > 0) {
                const usageByColor = {};

                completedPlates.forEach(plateIdx => {
                  const plate = plates[plateIdx];
                  if (!plate) return;

                  const parts = plate.parts || [];
                  const storedColors = plateColors[plateIdx] || {};

                  parts.forEach((part, partIdx) => {
                    const partQty = parseInt(part.quantity) || 1;
                    const partFilament = (parseFloat(part.filamentUsage) || 0) * partQty * o.quantity;
                    // Get color from stored plateColors or fall back to order color
                    const color = (typeof storedColors === 'object' ? storedColors[partIdx] : storedColors) || orderColor;

                    if (color && partFilament > 0) {
                      const colorLower = color.toLowerCase().trim();
                      if (!usageByColor[colorLower]) {
                        usageByColor[colorLower] = { color, amount: 0 };
                      }
                      usageByColor[colorLower].amount += partFilament;
                    }
                  });
                });

                // Add filament back for each color
                Object.values(usageByColor).forEach(({ color, amount }) => {
                  const colorLower = color.toLowerCase().trim();
                  const filamentIdx = memberFilaments.findIndex(f => {
                    const filColor = f.color.toLowerCase().trim();
                    return filColor === colorLower ||
                           filColor.includes(colorLower) ||
                           colorLower.includes(filColor);
                  });
                  if (filamentIdx >= 0 && amount > 0) {
                    memberFilaments[filamentIdx] = {
                      ...memberFilaments[filamentIdx],
                      amount: memberFilaments[filamentIdx].amount + amount
                    };
                    filamentChanged = true;
                  }
                });

                if (filamentChanged) {
                  const totalAdded = Object.values(usageByColor).reduce((sum, u) => sum + u.amount, 0);
                  showNotification(`Added back ${totalAdded.toFixed(2)}g of filament`);
                }
              }

              // Add back external parts
              if (model.externalParts?.length > 0) {
                const memberParts = [...(externalParts[o.assignedTo] || [])];
                model.externalParts.forEach(needed => {
                  const partIdx = memberParts.findIndex(p => p.name.toLowerCase() === needed.name.toLowerCase());
                  if (partIdx >= 0) {
                    memberParts[partIdx] = {
                      ...memberParts[partIdx],
                      quantity: memberParts[partIdx].quantity + (needed.quantity * o.quantity)
                    };
                  }
                });
                saveExternalParts({ ...externalParts, [o.assignedTo]: memberParts });
              }
            }
          }

          if (filamentChanged) {
            saveFilaments({ ...filaments, [o.assignedTo]: memberFilaments });
          }

          // Clear completion data when unfulfilling
          updates.completedPlates = [];
          updates.plateColors = {};
          updates.fulfilledAt = null;
        }

        // Deduct inventory when fulfilled
        if (newStatus === 'fulfilled' && o.assignedTo) {
          const ROLL_SIZE = 1000;
          const memberFilaments = [...(filaments[o.assignedTo] || [])];

          // Handle extra prints - use extraPrintFilament directly
          if (o.isExtraPrint && o.extraPrintFilament > 0) {
            const orderColor = (o.color || '').toLowerCase().trim();
            const filamentIdx = memberFilaments.findIndex(f => {
              const filColor = f.color.toLowerCase().trim();
              return filColor === orderColor ||
                     filColor.includes(orderColor) ||
                     orderColor.includes(filColor);
            });
            if (filamentIdx >= 0) {
              const totalUsed = o.extraPrintFilament;
              let newAmount = memberFilaments[filamentIdx].amount - totalUsed;
              let backupRolls = [...(memberFilaments[filamentIdx].backupRolls || [])];
              let currentRollCost = memberFilaments[filamentIdx].currentRollCost || 0;

              if (newAmount <= 0 && backupRolls.length > 0) {
                const nextRoll = backupRolls.shift();
                currentRollCost = nextRoll.cost;
                newAmount = ROLL_SIZE + newAmount;
                showNotification(`Auto-switched to new roll of ${memberFilaments[filamentIdx].color} ($${currentRollCost.toFixed(2)})! ${backupRolls.length} backup roll${backupRolls.length !== 1 ? 's' : ''} remaining.`);
              }

              memberFilaments[filamentIdx] = {
                ...memberFilaments[filamentIdx],
                amount: Math.max(0, newAmount),
                backupRolls: backupRolls,
                currentRollCost: currentRollCost
              };
              saveFilaments({ ...filaments, [o.assignedTo]: memberFilaments });

              // Record usage history for analytics
              if (totalUsed > 0) {
                const usageEvent = {
                  id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  color: memberFilaments[filamentIdx].color,
                  amount: totalUsed,
                  date: Date.now(),
                  orderId: o.orderId,
                  memberId: o.assignedTo,
                  modelName: o.item,
                  costPerGram: currentRollCost / 1000
                };
                setFilamentUsageHistory(prev => [...prev, usageEvent]);
              }
            }
          } else {
            // Regular order - look up model for filament usage
            const model = findModelByName(o.item);
            if (model) {
              // Check if plates were already completed (filament already deducted per-plate)
              const printerSettings = model.printerSettings?.find(ps => ps.printerId === o.printerId) || model.printerSettings?.[0];
              const plates = printerSettings?.plates || [];
              const completedPlates = o.completedPlates || [];
              const platesWereUsed = plates.length > 0 && completedPlates.length === plates.length;

              // Only deduct main filament if plates weren't used (filament not yet deducted)
              if (!platesWereUsed) {
                // Deduct filament - use printer-specific amount if available
                const orderColor = (o.color || model.defaultColor || '').toLowerCase().trim();
                const filamentIdx = memberFilaments.findIndex(f => {
                  const filColor = f.color.toLowerCase().trim();
                  // Match if exact, or if one contains the other (e.g., "Sunla PLA Black" matches "Black")
                  return filColor === orderColor ||
                         filColor.includes(orderColor) ||
                         orderColor.includes(filColor);
                });
                if (filamentIdx >= 0) {
                  // Sum filament from all plates
                  const filamentUsage = printerSettings?.plates?.reduce((sum, plate) =>
                    sum + (parseFloat(plate.filamentUsage) || 0), 0) || 0;
                  const totalUsed = filamentUsage * o.quantity;
                  let newAmount = memberFilaments[filamentIdx].amount - totalUsed;
                  let backupRolls = [...(memberFilaments[filamentIdx].backupRolls || [])];
                  let currentRollCost = memberFilaments[filamentIdx].currentRollCost || 0;

                  // If amount goes to 0 or below and we have backup rolls, switch to new roll
                  if (newAmount <= 0 && backupRolls.length > 0) {
                    const nextRoll = backupRolls.shift();
                    currentRollCost = nextRoll.cost;
                    newAmount = ROLL_SIZE + newAmount; // Add remaining to new roll
                    showNotification(`Auto-switched to new roll of ${memberFilaments[filamentIdx].color} ($${currentRollCost.toFixed(2)})! ${backupRolls.length} backup roll${backupRolls.length !== 1 ? 's' : ''} remaining.`);
                  }

                  memberFilaments[filamentIdx] = {
                    ...memberFilaments[filamentIdx],
                    amount: Math.max(0, newAmount),
                    backupRolls: backupRolls,
                    currentRollCost: currentRollCost
                  };
                  saveFilaments({ ...filaments, [o.assignedTo]: memberFilaments });

                  // Record usage history for analytics
                  if (totalUsed > 0) {
                    const usageEvent = {
                      id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      color: memberFilaments[filamentIdx].color,
                      amount: totalUsed,
                      date: Date.now(),
                      orderId: o.orderId,
                      memberId: o.assignedTo,
                      modelName: model.name
                    };
                    setFilamentUsageHistory(prev => [...prev, usageEvent]);
                  }
                }
              }

              // Deduct additional colors (for multi-color prints)
              if (o.additionalColors && o.additionalColors.length > 0) {
                let updatedFilaments = [...memberFilaments];
                o.additionalColors.forEach(addColor => {
                  const addColorName = (addColor.color || '').toLowerCase().trim();
                  const addFilamentIdx = updatedFilaments.findIndex(f => {
                    const filColor = f.color.toLowerCase().trim();
                    return filColor === addColorName ||
                           filColor.includes(addColorName) ||
                           addColorName.includes(filColor);
                  });
                  if (addFilamentIdx >= 0) {
                    const addTotalUsed = (parseFloat(addColor.filamentUsage) || 0) * o.quantity;
                    let addNewAmount = updatedFilaments[addFilamentIdx].amount - addTotalUsed;
                    let addBackupRolls = [...(updatedFilaments[addFilamentIdx].backupRolls || [])];
                    let addCurrentRollCost = updatedFilaments[addFilamentIdx].currentRollCost || 0;

                    if (addNewAmount <= 0 && addBackupRolls.length > 0) {
                      const nextRoll = addBackupRolls.shift();
                      addCurrentRollCost = nextRoll.cost;
                      addNewAmount = ROLL_SIZE + addNewAmount;
                      showNotification(`Auto-switched to new roll of ${updatedFilaments[addFilamentIdx].color} ($${addCurrentRollCost.toFixed(2)})!`);
                    }

                    updatedFilaments[addFilamentIdx] = {
                      ...updatedFilaments[addFilamentIdx],
                      amount: Math.max(0, addNewAmount),
                      backupRolls: addBackupRolls,
                      currentRollCost: addCurrentRollCost
                    };

                    // Record usage history
                    if (addTotalUsed > 0) {
                      const usageEvent = {
                        id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        color: updatedFilaments[addFilamentIdx].color,
                        amount: addTotalUsed,
                        date: Date.now(),
                        orderId: o.orderId,
                        memberId: o.assignedTo,
                        modelName: model.name
                      };
                      setFilamentUsageHistory(prev => [...prev, usageEvent]);
                    }
                  }
                });
                saveFilaments({ ...filaments, [o.assignedTo]: updatedFilaments });
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
        }
        
        return { ...o, ...updates };
      }
      return o;
    });
    saveOrders(updated);
  };

  // Check if order needs external part selection during fulfillment
  // This happens when the matched model has no external parts (base model)
  // but other variants of the same model have external parts
  const needsExternalPartPrompt = (order) => {
    const model = findBestModelMatch(order.item, order.extra);
    if (!model) return false;

    // If model already has external parts, no prompt needed
    if (model.externalParts && model.externalParts.length > 0) return false;

    // Check if there are other models with same name that have external parts
    const lowerName = model.name.toLowerCase();
    const variants = models.filter(m =>
      m.name.toLowerCase() === lowerName &&
      m.externalParts && m.externalParts.length > 0
    );

    return variants.length > 0;
  };

  // Get all external parts from Lighting, Electronics, and Hardware categories for the assigned member
  const getAvailableExternalParts = (order) => {
    if (!order.assignedTo) return [];

    // Get the member's external parts
    const memberParts = externalParts[order.assignedTo] || [];

    // Filter to only Lighting, Electronics, and Hardware categories
    const allowedCategories = ['lighting', 'electronics', 'hardware'];
    const filteredParts = memberParts.filter(p =>
      p.categoryId && allowedCategories.includes(p.categoryId)
    );

    // Return part objects with name and quantity
    return filteredParts.map(p => ({ name: p.name, quantity: p.quantity || 0 }));
  };

  // Initiate fulfillment - check if we need to prompt for external part
  const initiateFulfillment = (orderId) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    if (needsExternalPartPrompt(order)) {
      // Show prompt to select external part
      const availableParts = getAvailableExternalParts(order);
      setFulfillmentPartPrompt({
        orderId,
        modelName: order.item,
        availableParts
      });
    } else {
      // Fulfill directly
      updateOrderStatus(orderId, 'fulfilled');
    }
  };

  // Complete fulfillment with selected external parts (multiple with quantities)
  const completeFulfillmentWithParts = (orderId, partsWithQuantities) => {
    // partsWithQuantities is an object: {partName: quantity, ...}
    const partsArray = Object.entries(partsWithQuantities).filter(([_, qty]) => qty > 0);
    const order = orders.find(o => o.orderId === orderId);

    // Update order with selected parts AND fulfill status in one operation
    // (This prevents the usedExternalParts from being overwritten by updateOrderStatus)
    const updated = orders.map(o => {
      if (o.orderId === orderId) {
        return {
          ...o,
          usedExternalParts: partsWithQuantities,
          status: 'fulfilled',
          fulfilledAt: Date.now()
        };
      }
      return o;
    });
    saveOrders(updated);

    // Deduct the selected external parts from inventory
    if (order && order.assignedTo && partsArray.length > 0) {
      const memberParts = [...(externalParts[order.assignedTo] || [])];

      partsArray.forEach(([partName, qty]) => {
        const partIdx = memberParts.findIndex(p =>
          p.name.toLowerCase() === partName.toLowerCase()
        );
        if (partIdx >= 0) {
          memberParts[partIdx] = {
            ...memberParts[partIdx],
            quantity: Math.max(0, memberParts[partIdx].quantity - qty)
          };
        }
      });

      saveExternalParts({ ...externalParts, [order.assignedTo]: memberParts });
    }

    // Close prompt and reset selection
    setFulfillmentPartPrompt(null);
    setSelectedFulfillmentParts({});
    showNotification('Order fulfilled with selected parts');
  };

  // Toggle plate completion and deduct/add filament
  // partColors is an object { partIndex: color } for per-part color tracking
  const togglePlateComplete = (orderId, plateIndex, model, partColors) => {
    const ROLL_SIZE = 1000;
    const order = orders.find(o => o.orderId === orderId);
    if (!order || !order.assignedTo) return;

    const completedPlates = order.completedPlates || [];
    const storedPlateColors = order.plateColors || {};
    const isCompleting = !completedPlates.includes(plateIndex);

    // Get the plate's filament usage
    const printerSettings = model?.printerSettings?.find(ps => ps.printerId === order.printerId) || model?.printerSettings?.[0];
    const plate = printerSettings?.plates?.[plateIndex];
    if (!plate) return;

    const parts = plate.parts || [];
    const orderColor = order.color || model?.defaultColor || '';

    // Build color map for each part
    // If completing: use partColors param (multi-color) or order color (non-multi-color)
    // If uncompleting: use stored colors from plateColors
    const colorsToUse = {};
    if (isCompleting) {
      parts.forEach((part, partIdx) => {
        if (part.isMultiColor) {
          colorsToUse[partIdx] = partColors?.[partIdx] || '';
        } else {
          colorsToUse[partIdx] = orderColor;
        }
      });
    } else {
      // When uncompleting, use stored colors
      const storedColors = storedPlateColors[plateIndex] || {};
      parts.forEach((part, partIdx) => {
        colorsToUse[partIdx] = storedColors[partIdx] || orderColor;
      });
    }

    // Group filament usage by color
    const usageByColor = {};
    let totalPlateFilament = 0;
    parts.forEach((part, partIdx) => {
      const partQty = parseInt(part.quantity) || 1;
      const partFilament = (parseFloat(part.filamentUsage) || 0) * partQty * order.quantity;
      const color = colorsToUse[partIdx];
      if (color && partFilament > 0) {
        const colorLower = color.toLowerCase().trim();
        if (!usageByColor[colorLower]) {
          usageByColor[colorLower] = { color: color, amount: 0 };
        }
        usageByColor[colorLower].amount += partFilament;
        totalPlateFilament += partFilament;
      }
    });

    // Handle filament deduction/addition for each color
    const memberFilaments = [...(filaments[order.assignedTo] || [])];
    let filamentChanged = false;

    Object.values(usageByColor).forEach(({ color, amount }) => {
      const colorLower = color.toLowerCase().trim();
      const filamentIdx = memberFilaments.findIndex(f => {
        const filColor = f.color.toLowerCase().trim();
        return filColor === colorLower ||
               filColor.includes(colorLower) ||
               colorLower.includes(filColor);
      });

      if (filamentIdx >= 0 && amount > 0) {
        let newAmount = memberFilaments[filamentIdx].amount;
        let backupRolls = [...(memberFilaments[filamentIdx].backupRolls || [])];
        let currentRollCost = memberFilaments[filamentIdx].currentRollCost || 0;

        if (isCompleting) {
          // Deduct filament when completing plate
          newAmount -= amount;
          if (newAmount <= 0 && backupRolls.length > 0) {
            const nextRoll = backupRolls.shift();
            currentRollCost = nextRoll.cost;
            newAmount = ROLL_SIZE + newAmount;
            showNotification(`Auto-switched to new roll of ${memberFilaments[filamentIdx].color}!`);
          }

          // Record usage history
          const usageEvent = {
            id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            color: memberFilaments[filamentIdx].color,
            amount: amount,
            date: Date.now(),
            orderId: order.orderId,
            memberId: order.assignedTo,
            modelName: model?.name || order.item,
            plateName: plate.name
          };
          setFilamentUsageHistory(prev => [...prev, usageEvent]);
        } else {
          // Add filament back when uncompleting plate
          newAmount += amount;
        }

        memberFilaments[filamentIdx] = {
          ...memberFilaments[filamentIdx],
          amount: Math.max(0, newAmount),
          backupRolls: backupRolls,
          currentRollCost: currentRollCost
        };
        filamentChanged = true;
      }
    });

    if (filamentChanged) {
      saveFilaments({ ...filaments, [order.assignedTo]: memberFilaments });
    }

    // Calculate plate print time from all parts (in hours, accounting for part quantity)
    const platePrintHours = parts.reduce((sum, part) => {
      const hours = parseFloat(part.printHours) || 0;
      const minutes = parseFloat(part.printMinutes) || 0;
      const partQty = parseInt(part.quantity) || 1;
      return sum + (hours + (minutes / 60)) * partQty;
    }, 0) * order.quantity;

    // Update printer hours when completing/uncompleting a plate
    if (order.printerId && platePrintHours > 0) {
      const updatedPrinters = printers.map(p => {
        if (p.id === order.printerId) {
          const currentHours = p.totalHours || 0;
          const newHours = isCompleting
            ? currentHours + platePrintHours
            : Math.max(0, currentHours - platePrintHours);
          return { ...p, totalHours: newHours };
        }
        return p;
      });
      savePrinters(updatedPrinters);
    }

    // Update order's completedPlates array and plateColors
    const updated = orders.map(o => {
      if (o.orderId === orderId) {
        let newCompletedPlates;
        let newPlateColors = { ...(o.plateColors || {}) };

        if (isCompleting) {
          newCompletedPlates = [...completedPlates, plateIndex];
          // Store the colors used for each part (only for multi-color parts)
          newPlateColors[plateIndex] = colorsToUse;
        } else {
          newCompletedPlates = completedPlates.filter(idx => idx !== plateIndex);
          // Remove the stored colors when uncompleting
          delete newPlateColors[plateIndex];
        }
        return { ...o, completedPlates: newCompletedPlates, plateColors: newPlateColors };
      }
      return o;
    });
    saveOrders(updated);

    const plateName = plate.name || `Plate ${plateIndex + 1}`;
    const colorList = Object.values(usageByColor).map(u => u.color).join(', ');
    const colorInfo = colorList ? ` (${colorList})` : '';
    const timeInfo = platePrintHours > 0 ? `, +${platePrintHours.toFixed(1)}h` : '';
    showNotification(isCompleting
      ? `${plateName} completed${colorInfo}! (${totalPlateFilament.toFixed(2)}g deducted${timeInfo})`
      : `${plateName} uncompleted (${totalPlateFilament.toFixed(2)}g added back)`
    );
  };

  // Reprint a specific part from a plate with color selection
  const reprintPart = (orderId, plateIndex, partIndex, selectedColor, model) => {
    const ROLL_SIZE = 1000;
    const order = orders.find(o => o.orderId === orderId);
    if (!order || !order.assignedTo || !selectedColor) return;

    // Get the plate and part
    const printerSettings = model?.printerSettings?.find(ps => ps.printerId === order.printerId) || model?.printerSettings?.[0];
    const plate = printerSettings?.plates?.[plateIndex];
    const part = plate?.parts?.[partIndex];
    if (!plate || !part) return;

    const partFilament = (parseFloat(part.filamentUsage) || 0);

    // Deduct filament from the selected color
    if (partFilament > 0) {
      const memberFilaments = [...(filaments[order.assignedTo] || [])];
      const colorLower = selectedColor.toLowerCase().trim();
      const filamentIdx = memberFilaments.findIndex(f => {
        const filColor = f.color.toLowerCase().trim();
        return filColor === colorLower ||
               filColor.includes(colorLower) ||
               colorLower.includes(filColor);
      });

      if (filamentIdx >= 0) {
        let newAmount = memberFilaments[filamentIdx].amount - partFilament;
        let backupRolls = [...(memberFilaments[filamentIdx].backupRolls || [])];
        let currentRollCost = memberFilaments[filamentIdx].currentRollCost || 0;

        if (newAmount <= 0 && backupRolls.length > 0) {
          const nextRoll = backupRolls.shift();
          currentRollCost = nextRoll.cost;
          newAmount = ROLL_SIZE + newAmount;
          showNotification(`Auto-switched to new roll of ${memberFilaments[filamentIdx].color}!`);
        }

        memberFilaments[filamentIdx] = {
          ...memberFilaments[filamentIdx],
          amount: Math.max(0, newAmount),
          backupRolls: backupRolls,
          currentRollCost: currentRollCost
        };
        saveFilaments({ ...filaments, [order.assignedTo]: memberFilaments });

        // Record usage history for the reprint
        const usageEvent = {
          id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          color: memberFilaments[filamentIdx].color,
          amount: partFilament,
          date: Date.now(),
          orderId: order.orderId,
          memberId: order.assignedTo,
          modelName: model?.name || order.item,
          plateName: plate.name,
          partName: part.name,
          isReprint: true
        };
        setFilamentUsageHistory(prev => [...prev, usageEvent]);
      }
    }

    // Calculate part print time (in hours)
    const partPrintHours = (parseFloat(part.printHours) || 0) + ((parseFloat(part.printMinutes) || 0) / 60);

    // Update printer hours for the reprint
    if (order.printerId && partPrintHours > 0) {
      const updatedPrinters = printers.map(p => {
        if (p.id === order.printerId) {
          const currentHours = p.totalHours || 0;
          return { ...p, totalHours: currentHours + partPrintHours };
        }
        return p;
      });
      savePrinters(updatedPrinters);
    }

    // Add reprint to order's plateReprints array
    const updated = orders.map(o => {
      if (o.orderId === orderId) {
        const newReprints = [...(o.plateReprints || []), {
          id: `reprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          plateIndex,
          partIndex,
          partName: part.name,
          color: selectedColor,
          filamentUsage: partFilament,
          printHours: partPrintHours,
          timestamp: Date.now()
        }];
        return { ...o, plateReprints: newReprints };
      }
      return o;
    });
    saveOrders(updated);

    const timeInfo = partPrintHours > 0 ? `, +${partPrintHours.toFixed(1)}h` : '';
    showNotification(`Reprinted ${part.name} in ${selectedColor} (${partFilament}g deducted${timeInfo})`);
  };

  // Delete a reprint and restore filament/printer hours
  const deleteReprint = (orderId, reprintId, reprintObj) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    // Use the passed reprint object directly (more reliable)
    const reprint = reprintObj || order.plateReprints?.find(r => r.id === reprintId);
    if (!reprint) return;

    // Add back the filament that was deducted
    if (reprint.filamentUsage > 0 && order.assignedTo && reprint.color) {
      const memberFilaments = [...(filaments[order.assignedTo] || [])];
      const colorLower = reprint.color.toLowerCase().trim();
      const filamentIdx = memberFilaments.findIndex(f => {
        const filColor = f.color.toLowerCase().trim();
        return filColor === colorLower ||
               filColor.includes(colorLower) ||
               colorLower.includes(filColor);
      });

      if (filamentIdx >= 0) {
        memberFilaments[filamentIdx] = {
          ...memberFilaments[filamentIdx],
          amount: memberFilaments[filamentIdx].amount + reprint.filamentUsage
        };
        saveFilaments({ ...filaments, [order.assignedTo]: memberFilaments });
      }
    }

    // Subtract printer hours that were added
    if (order.printerId && reprint.printHours > 0) {
      const updatedPrinters = printers.map(p => {
        if (p.id === order.printerId) {
          const currentHours = p.totalHours || 0;
          return { ...p, totalHours: Math.max(0, currentHours - reprint.printHours) };
        }
        return p;
      });
      savePrinters(updatedPrinters);
    }

    // Remove reprint from order's plateReprints array
    // Match by id if available, otherwise by plateIndex + partIndex + timestamp
    const updated = orders.map(o => {
      if (o.orderId === orderId) {
        const newReprints = (o.plateReprints || []).filter(r => {
          if (reprint.id && r.id) {
            return r.id !== reprint.id;
          }
          // Fallback: match by plateIndex, partIndex, and timestamp
          return !(r.plateIndex === reprint.plateIndex &&
                   r.partIndex === reprint.partIndex &&
                   r.timestamp === reprint.timestamp);
        });
        return { ...o, plateReprints: newReprints };
      }
      return o;
    });
    saveOrders(updated);

    showNotification(`Deleted reprint: ${reprint.partName} (${reprint.filamentUsage}g restored)`);
  };

  // Reassign order (also clears any assignment issue)
  const reassignOrder = (orderId, memberId) => {
    const updated = orders.map(o =>
      o.orderId === orderId ? { ...o, assignedTo: memberId || null, assignmentIssue: null } : o
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
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'queue', label: 'Order Queue', icon: Package },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'stores', label: 'Stores', icon: Store },
    { id: 'printers', label: 'Printers', icon: Printer },
    { id: 'filament', label: 'Filament', icon: Palette },
    { id: 'models', label: 'Models', icon: Box },
    { id: 'parts', label: 'Supplies', icon: ShoppingBag },
    { id: 'costs', label: 'Costs', icon: DollarSign },
    { id: 'finance', label: 'Finance', icon: PieChart },
    { id: 'restock', label: 'Restock', icon: AlertCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
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
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1rem;
          align-items: start;
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
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (googleSheetUrl) {
                syncFromGoogleSheet();
              } else {
                setShowCsvModal(true);
              }
            }}
            disabled={syncingSheet}
            style={{ marginRight: '8px' }}
            title={googleSheetUrl ? "Sync orders from Google Sheets" : "Set up Google Sheets sync"}
          >
            {syncingSheet ? (
              <><RefreshCw size={18} className="spinning" /> Syncing...</>
            ) : (
              <><ShoppingBag size={18} /> {googleSheetUrl ? 'Sync Sheet' : 'Sheet Sync'}</>
            )}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCsvModal(true)}>
            <Upload size={18} />
            Import
          </button>
        </div>
      </header>

      <div className="main-content">
        <nav className="sidebar">
          {tabs.map(tab => {
            // Calculate restock count for badge (supplies + filaments + models)
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
              // Count filaments needing restock (at or below threshold and 0 rolls)
              teamMembers.forEach(member => {
                const memberFilaments = filaments[member.id] || [];
                memberFilaments.forEach(fil => {
                  const threshold = fil.reorderAt ?? 250;
                  if (fil.amount <= threshold && (fil.backupRolls?.length || 0) === 0) {
                    restockCount++;
                  }
                });
              });
              // Count models needing restock (stock count ≤ 3)
              models.forEach(model => {
                if (model.stockCount !== null && model.stockCount !== undefined && model.stockCount <= 3) {
                  restockCount++;
                }
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
          {/* Low Stock Alerts Banner */}
          <LowStockAlerts
            filaments={filaments}
            externalParts={externalParts}
            teamMembers={teamMembers}
            models={models}
            setActiveTab={setActiveTab}
          />
          {activeTab === 'dashboard' && (
            <DashboardTab
              orders={orders}
              archivedOrders={archivedOrders}
              purchases={purchases}
              models={models}
              stores={stores}
              filaments={filaments}
              externalParts={externalParts}
            />
          )}

          {activeTab === 'queue' && (
            <QueueTab
              orders={orders}
              setOrders={setOrders}
              teamMembers={teamMembers}
              stores={stores}
              printers={printers}
              models={models}
              filaments={filaments}
              externalParts={externalParts}
              selectedStoreFilter={selectedStoreFilter}
              setSelectedStoreFilter={setSelectedStoreFilter}
              updateOrderStatus={updateOrderStatus}
              initiateFulfillment={initiateFulfillment}
              reassignOrder={reassignOrder}
              showNotification={showNotification}
              saveFilaments={saveFilaments}
              togglePlateComplete={togglePlateComplete}
              reprintPart={reprintPart}
              deleteReprint={deleteReprint}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleTab
              orders={orders}
              models={models}
              teamMembers={teamMembers}
              printers={printers}
              setOrders={setOrders}
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

          {activeTab === 'printers' && (
            <PrintersTab
              printers={printers}
              savePrinters={savePrinters}
              orders={orders}
              teamMembers={teamMembers}
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
              printers={printers}
              externalParts={externalParts}
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

          {activeTab === 'costs' && (
            <CostsTab
              purchases={purchases}
              savePurchases={savePurchases}
              subscriptions={subscriptions}
              saveSubscriptions={saveSubscriptions}
              printers={printers}
              showNotification={showNotification}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceTab
              orders={orders}
              archivedOrders={archivedOrders}
              purchases={purchases}
              subscriptions={subscriptions}
              printers={printers}
              teamMembers={teamMembers}
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

          {activeTab === 'analytics' && (
            <AnalyticsTab
              orders={orders}
              setOrders={setOrders}
              archivedOrders={archivedOrders}
              setArchivedOrders={setArchivedOrders}
              models={models}
              filaments={filaments}
              teamMembers={teamMembers}
              filamentUsageHistory={filamentUsageHistory}
              showNotification={showNotification}
            />
          )}

          {activeTab === 'archive' && (
            <ArchiveTab
              archivedOrders={archivedOrders}
              saveArchivedOrders={setArchivedOrders}
              orders={orders}
              setOrders={setOrders}
              teamMembers={teamMembers}
              models={models}
              stores={stores}
              showNotification={showNotification}
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
              <h2 className="modal-title">Import Orders</h2>
              <button className="modal-close" onClick={() => { setShowCsvModal(false); setCsvPreview(null); setCsvInput(''); setImportStoreId(''); }}>
                <X size={24} />
              </button>
            </div>

            {/* Google Sheets Sync Section */}
            <div style={{
              background: 'rgba(0,204,255,0.1)',
              border: '1px solid rgba(0,204,255,0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShoppingBag size={20} style={{ color: '#00ccff' }} />
                <strong style={{ color: '#00ccff' }}>Google Sheets Sync</strong>
                {googleSheetUrl && <Check size={16} style={{ color: '#00ff88' }} />}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '12px' }}>
                Connect your Google Sheet to auto-import orders. Make sure the sheet is shared as "Anyone with the link can view".
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={googleSheetUrl}
                  onChange={e => setGoogleSheetUrl(e.target.value)}
                  placeholder="Paste Google Sheet URL here..."
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (googleSheetUrl) {
                      localStorage.setItem('googleSheetUrl', googleSheetUrl);
                      syncFromGoogleSheet();
                    }
                  }}
                  disabled={!googleSheetUrl || syncingSheet}
                >
                  {syncingSheet ? (
                    <><RefreshCw size={16} className="spinning" /> Syncing</>
                  ) : (
                    <><RefreshCw size={16} /> Sync Now</>
                  )}
                </button>
              </div>
              {googleSheetUrl && (
                <p style={{ fontSize: '0.75rem', color: '#00ff88', marginTop: '8px' }}>
                  Sheet URL saved. Use the "Sync Sheet" button in the header anytime.
                </p>
              )}
            </div>

            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '16px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Upload size={20} style={{ color: '#00ff88' }} />
                <strong>Manual CSV Import</strong>
              </div>
              <p className="csv-help" style={{ margin: 0 }}>
                Or paste your Etsy order data below. Supports tab-separated or concatenated format.
              </p>
            </div>
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
                    <div>
                      <span style={{ color: '#888' }}>Price: </span>
                      <span style={{ color: csvPreview.price && csvPreview.price !== '$0' ? '#00ff88' : '#888' }}>
                        {csvPreview.price?.startsWith('$') ? csvPreview.price : `$${csvPreview.price || '0'}`}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#888' }}>Tax: </span>
                      <span style={{ color: csvPreview.salesTax > 0 ? '#ff9f43' : '#888' }}>
                        ${csvPreview.salesTax?.toFixed(2) || '0.00'}
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

      {/* External Part Selection Modal for Fulfillment */}
      {fulfillmentPartPrompt && (
        <div className="modal-overlay" onClick={() => { setFulfillmentPartPrompt(null); setSelectedFulfillmentParts({}); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Select External Parts Used</h2>
              <button className="modal-close" onClick={() => { setFulfillmentPartPrompt(null); setSelectedFulfillmentParts({}); }}>
                <X size={24} />
              </button>
            </div>
            <p style={{ marginBottom: '16px', color: '#888' }}>
              Which external parts were used for this order? Select parts and quantities.
            </p>
            {(() => {
              // Check if any selected part exceeds available stock
              const hasStockIssue = Object.entries(selectedFulfillmentParts).some(([partName, qty]) => {
                const part = fulfillmentPartPrompt.availableParts.find(p => p.name === partName);
                return part && qty > part.quantity;
              });

              return (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {fulfillmentPartPrompt.availableParts.map(part => {
                      const partName = part.name;
                      const stock = part.quantity || 0;
                      const isOutOfStock = stock === 0;
                      const selectedQty = selectedFulfillmentParts[partName] || 0;
                      const exceedsStock = selectedQty > stock;

                      return (
                        <div
                          key={partName}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: isOutOfStock
                              ? 'rgba(255, 0, 0, 0.1)'
                              : exceedsStock
                                ? 'rgba(255, 159, 67, 0.15)'
                                : selectedFulfillmentParts[partName] > 0
                                  ? 'rgba(0, 255, 136, 0.1)'
                                  : 'rgba(255,255,255,0.05)',
                            border: isOutOfStock
                              ? '1px solid rgba(255, 0, 0, 0.3)'
                              : exceedsStock
                                ? '1px solid rgba(255, 159, 67, 0.4)'
                                : selectedFulfillmentParts[partName] > 0
                                  ? '1px solid rgba(0, 255, 136, 0.3)'
                                  : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            opacity: isOutOfStock ? 0.6 : 1
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFulfillmentParts[partName] > 0}
                            disabled={isOutOfStock}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedFulfillmentParts({ ...selectedFulfillmentParts, [partName]: 1 });
                              } else {
                                const { [partName]: _, ...rest } = selectedFulfillmentParts;
                                setSelectedFulfillmentParts(rest);
                              }
                            }}
                            style={{ width: '18px', height: '18px', cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: selectedFulfillmentParts[partName] > 0 ? '500' : '400' }}>
                              {partName}
                            </span>
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '0.8rem',
                              color: isOutOfStock ? '#ff4444' : stock <= 5 ? '#ff9f43' : '#888'
                            }}>
                              ({stock} in stock)
                            </span>
                            {isOutOfStock && (
                              <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#ff4444' }}>
                                OUT OF STOCK
                              </span>
                            )}
                          </div>
                          {selectedFulfillmentParts[partName] > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#888', fontSize: '0.85rem' }}>Qty:</span>
                              <input
                                type="number"
                                min="1"
                                max={stock}
                                value={selectedFulfillmentParts[partName] || 1}
                                onChange={e => {
                                  const qty = parseInt(e.target.value) || 1;
                                  setSelectedFulfillmentParts({ ...selectedFulfillmentParts, [partName]: qty });
                                }}
                                style={{
                                  width: '60px',
                                  padding: '6px 10px',
                                  background: exceedsStock ? 'rgba(255,0,0,0.2)' : 'rgba(0,0,0,0.3)',
                                  border: exceedsStock ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.2)',
                                  borderRadius: '6px',
                                  color: '#fff',
                                  fontSize: '1rem',
                                  textAlign: 'center'
                                }}
                              />
                              {exceedsStock && (
                                <span style={{ color: '#ff4444', fontSize: '0.75rem' }}>
                                  Exceeds stock!
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {hasStockIssue && (
                    <p style={{ color: '#ff4444', fontSize: '0.85rem', marginBottom: '12px' }}>
                      Cannot fulfill: Some selected parts exceed available stock.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => { setFulfillmentPartPrompt(null); setSelectedFulfillmentParts({}); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => completeFulfillmentWithParts(fulfillmentPartPrompt.orderId, {})}
                      style={{ opacity: 0.7 }}
                    >
                      No Parts Used
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => completeFulfillmentWithParts(fulfillmentPartPrompt.orderId, selectedFulfillmentParts)}
                      disabled={Object.keys(selectedFulfillmentParts).length === 0 || hasStockIssue}
                      style={(Object.keys(selectedFulfillmentParts).length === 0 || hasStockIssue) ? { opacity: 0.5 } : {}}
                    >
                      Confirm & Fulfill
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Calculate ship by date adding business days (skipping weekends)
function calculateShipByDate(orderDate, processingDays) {
  if (!orderDate || !processingDays) return null;

  const date = new Date(orderDate);
  if (isNaN(date.getTime())) return null;

  let daysToAdd = processingDays;

  while (daysToAdd > 0) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysToAdd--;
    }
  }

  return date;
}

// Queue Tab Component
function QueueTab({ orders, setOrders, teamMembers, stores, printers, models, filaments, externalParts, selectedStoreFilter, setSelectedStoreFilter, updateOrderStatus, initiateFulfillment, reassignOrder, showNotification, saveFilaments, togglePlateComplete, reprintPart, deleteReprint }) {
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'received', 'fulfilled', 'shipped'
  const [showExtraPrintForm, setShowExtraPrintForm] = useState(false);
  const [groupByBuyer, setGroupByBuyer] = useState(false);
  const [collapsedBuyers, setCollapsedBuyers] = useState({});
  const [extraPrint, setExtraPrint] = useState({
    name: '',
    color: '',
    filamentUsage: '',
    printHours: '0',
    printMinutes: '0',
    assignedTo: teamMembers[0]?.id || '',
    printerId: ''
  });

  // Add extra print to queue
  const addExtraPrint = () => {
    if (!extraPrint.name || !extraPrint.filamentUsage || !extraPrint.color) {
      showNotification('Please fill in name, color, and filament usage', 'error');
      return;
    }

    const newOrder = {
      id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: `EXTRA-${Date.now().toString().slice(-6)}`,
      item: extraPrint.name,
      buyerName: 'Extra Print',
      quantity: 1,
      color: extraPrint.color,
      price: '$0.00',
      status: 'pending',
      assignedTo: extraPrint.assignedTo || null,
      printerId: extraPrint.printerId || null,
      isExtraPrint: true,
      extraPrintFilament: parseFloat(extraPrint.filamentUsage) || 0,
      extraPrintMinutes: (parseInt(extraPrint.printHours) || 0) * 60 + (parseInt(extraPrint.printMinutes) || 0),
      createdAt: Date.now(),
      storeId: null
    };

    setOrders([newOrder, ...orders]);
    setExtraPrint({
      name: '',
      color: '',
      filamentUsage: '',
      printHours: '0',
      printMinutes: '0',
      assignedTo: teamMembers[0]?.id || '',
      printerId: ''
    });
    setShowExtraPrintForm(false);
    showNotification('Extra print added to queue');
  };
  
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
  
  // Helper to find matching model for an order
  const findModelForOrder = (order) => {
    if (!order.item) return null;
    const lowerItem = order.item.toLowerCase();
    const extra = (order.extra || '').toLowerCase().trim();

    return models.find(m => {
      const nameMatch = m.name.toLowerCase() === lowerItem ||
        m.name.toLowerCase().includes(lowerItem) ||
        lowerItem.includes(m.name.toLowerCase()) ||
        (m.aliases && m.aliases.some(alias => {
          const lowerAlias = alias.toLowerCase();
          return lowerAlias === lowerItem || lowerAlias.includes(lowerItem) || lowerItem.includes(lowerAlias);
        }));

      if (!nameMatch) return false;

      // Check variant match if model has a variant
      if (m.variantName) {
        const variantLower = m.variantName.toLowerCase();
        return extra.includes(variantLower) || variantLower.includes(extra);
      }
      return true;
    });
  };

  // Filter by status, then sort by color (grouped), then by ship by date (earliest first within each color)
  const activeOrders = filteredOrders.filter(o => {
    if (statusFilter === 'active') return o.status !== 'shipped';
    if (statusFilter === 'received') return o.status === 'received';
    if (statusFilter === 'fulfilled') return o.status === 'fulfilled';
    if (statusFilter === 'shipped') return o.status === 'shipped';
    return true;
  }).sort((a, b) => {
    // Primary sort: by color (alphabetically, so same colors are grouped)
    const colorA = (a.color || '').toLowerCase();
    const colorB = (b.color || '').toLowerCase();
    if (colorA !== colorB) {
      return colorA.localeCompare(colorB);
    }

    // Secondary sort: by ship by date (earliest first)
    // Use override if set, otherwise calculate from model
    const modelA = findModelForOrder(a);
    const modelB = findModelForOrder(b);
    const shipByA = a.overrideShipByDate ? new Date(a.overrideShipByDate) : calculateShipByDate(a.createdAt, modelA?.processingDays || 3);
    const shipByB = b.overrideShipByDate ? new Date(b.overrideShipByDate) : calculateShipByDate(b.createdAt, modelB?.processingDays || 3);

    if (!shipByA && !shipByB) return 0;
    if (!shipByA) return 1;
    if (!shipByB) return -1;
    return shipByA.getTime() - shipByB.getTime();
  });

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

        {/* Extra Print Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExtraPrintForm(!showExtraPrintForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: showExtraPrintForm ? 'rgba(255, 159, 67, 0.2)' : 'rgba(255, 159, 67, 0.1)',
              border: '1px solid rgba(255, 159, 67, 0.4)',
              borderRadius: '8px',
              color: '#ff9f43',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            <RefreshCw size={16} />
            Extra Print
            <ChevronRight
              size={14}
              style={{
                transform: showExtraPrintForm ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </button>

          {/* Extra Print Dropdown */}
          {showExtraPrintForm && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              marginTop: '8px',
              background: '#1a1a2e',
              border: '1px solid rgba(255, 159, 67, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              width: '320px',
              zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.75rem' }}>Description *</label>
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="e.g., Tray lid reprint"
                  value={extraPrint.name}
                  onChange={e => setExtraPrint({ ...extraPrint, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.75rem' }}>Color *</label>
                  <input
                    type="text"
                    className="add-item-input"
                    placeholder="Sage Green"
                    value={extraPrint.color}
                    onChange={e => setExtraPrint({ ...extraPrint, color: e.target.value })}
                    style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.75rem' }}>Filament (g) *</label>
                  <input
                    type="number"
                    className="add-item-input"
                    placeholder="25"
                    value={extraPrint.filamentUsage}
                    onChange={e => setExtraPrint({ ...extraPrint, filamentUsage: e.target.value })}
                    style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                    min="0"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.75rem' }}>Time (h:m)</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="number"
                      className="add-item-input"
                      placeholder="0"
                      value={extraPrint.printHours}
                      onChange={e => setExtraPrint({ ...extraPrint, printHours: e.target.value })}
                      style={{ width: '50%', padding: '8px', fontSize: '0.85rem' }}
                      min="0"
                    />
                    <input
                      type="number"
                      className="add-item-input"
                      placeholder="0"
                      value={extraPrint.printMinutes}
                      onChange={e => setExtraPrint({ ...extraPrint, printMinutes: e.target.value })}
                      style={{ width: '50%', padding: '8px', fontSize: '0.85rem' }}
                      min="0"
                      max="59"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.75rem' }}>Assign To</label>
                  <select
                    value={extraPrint.assignedTo}
                    onChange={e => setExtraPrint({ ...extraPrint, assignedTo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.75rem' }}>Printer</label>
                <select
                  value={extraPrint.printerId}
                  onChange={e => setExtraPrint({ ...extraPrint, printerId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="">Select Printer</option>
                  {printers?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={addExtraPrint}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #ff9f43 0%, #ee5a24 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Add to Queue
              </button>
            </div>
          )}
        </div>

        {/* Group by Buyer Toggle */}
        <button
          onClick={() => setGroupByBuyer(!groupByBuyer)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: groupByBuyer ? 'rgba(0, 204, 255, 0.2)' : 'rgba(0, 204, 255, 0.1)',
            border: `1px solid ${groupByBuyer ? 'rgba(0, 204, 255, 0.6)' : 'rgba(0, 204, 255, 0.3)'}`,
            borderRadius: '8px',
            color: '#00ccff',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}
        >
          <Users size={16} />
          Group by Buyer
          {groupByBuyer && <Check size={14} />}
        </button>

        {/* Delete All Orders Button */}
        <button
          onClick={() => {
            if (orders.length === 0) {
              showNotification('No orders to delete', 'error');
              return;
            }
            if (confirm(`Are you sure you want to delete ALL ${orders.length} orders?\n\nThis action cannot be undone!`)) {
              setOrders([]);
              showNotification(`Deleted ${orders.length} orders`);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.4)',
            borderRadius: '8px',
            color: '#ff4757',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '500',
            marginLeft: 'auto'
          }}
        >
          <Trash2 size={16} />
          Clear Queue
        </button>
      </div>
      
      {/* Stats - Clickable to filter */}
      <div className="stats-grid">
        <div
          className="stat-card"
          onClick={() => setStatusFilter('received')}
          style={{
            cursor: 'pointer',
            border: statusFilter === 'received' ? '2px solid #ffc107' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          <div className="stat-label">Received</div>
          <div className="stat-value" style={{ color: statusFilter === 'received' ? '#ffc107' : undefined }}>{receivedCount}</div>
          {statusFilter === 'received' && <div style={{ fontSize: '0.7rem', color: '#ffc107', marginTop: '4px' }}>Filtered</div>}
        </div>
        <div
          className="stat-card"
          onClick={() => setStatusFilter('fulfilled')}
          style={{
            cursor: 'pointer',
            border: statusFilter === 'fulfilled' ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          <div className="stat-label">Fulfilled</div>
          <div className="stat-value" style={{ color: statusFilter === 'fulfilled' ? '#00ff88' : undefined }}>{fulfilledCount}</div>
          {statusFilter === 'fulfilled' && <div style={{ fontSize: '0.7rem', color: '#00ff88', marginTop: '4px' }}>Filtered</div>}
        </div>
        <div
          className="stat-card"
          onClick={() => setStatusFilter('shipped')}
          style={{
            cursor: 'pointer',
            border: statusFilter === 'shipped' ? '2px solid #00ccff' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          <div className="stat-label">Shipped</div>
          <div className="stat-value" style={{ color: statusFilter === 'shipped' ? '#00ccff' : undefined }}>{shippedCount}</div>
          {statusFilter === 'shipped' && <div style={{ fontSize: '0.7rem', color: '#00ccff', marginTop: '4px' }}>Filtered</div>}
        </div>
        <div
          className="stat-card"
          onClick={() => setStatusFilter('active')}
          style={{
            cursor: 'pointer',
            border: statusFilter === 'active' ? '2px solid #a55eea' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          <div className="stat-label">Total Active</div>
          <div className="stat-value" style={{ color: statusFilter === 'active' ? '#a55eea' : undefined }}>{filteredOrders.filter(o => o.status !== 'shipped').length}</div>
          {statusFilter === 'active' && <div style={{ fontSize: '0.7rem', color: '#a55eea', marginTop: '4px' }}>Showing All Active</div>}
        </div>
      </div>

      {/* Group orders by buyer name when enabled */}
      {(() => {
        // Group orders by buyer name (normalized)
        const ordersByBuyer = activeOrders.reduce((acc, order) => {
          const buyerName = (order.buyerName || 'Unknown Buyer').trim();
          if (!acc[buyerName]) acc[buyerName] = [];
          acc[buyerName].push(order);
          return acc;
        }, {});

        // Sort buyers: multi-order buyers first, then by name
        const sortedBuyers = Object.keys(ordersByBuyer).sort((a, b) => {
          const aCount = ordersByBuyer[a].length;
          const bCount = ordersByBuyer[b].length;
          if (aCount > 1 && bCount === 1) return -1;
          if (aCount === 1 && bCount > 1) return 1;
          if (aCount !== bCount) return bCount - aCount;
          return a.localeCompare(b);
        });

        // Count buyers with multiple orders
        const multiBuyerCount = sortedBuyers.filter(b => ordersByBuyer[b].length > 1).length;

        // Render grouped view
        if (groupByBuyer) {
          return (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} style={{ color: '#00ccff' }} />
                Orders by Buyer ({sortedBuyers.length} buyers, {activeOrders.length} orders)
                {multiBuyerCount > 0 && (
                  <span style={{
                    background: 'rgba(255, 159, 67, 0.2)',
                    color: '#ff9f43',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    marginLeft: '8px'
                  }}>
                    {multiBuyerCount} multi-order buyer{multiBuyerCount > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              {activeOrders.length === 0 ? (
                <div className="empty-state">
                  <Package />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sortedBuyers.map(buyerName => {
                    const buyerOrders = ordersByBuyer[buyerName];
                    const isMultiOrder = buyerOrders.length > 1;
                    const isCollapsed = collapsedBuyers[buyerName];

                    return (
                      <div key={buyerName} style={{
                        background: isMultiOrder
                          ? 'linear-gradient(135deg, rgba(255,159,67,0.08) 0%, rgba(255,159,67,0.03) 100%)'
                          : 'transparent',
                        border: isMultiOrder ? '1px solid rgba(255,159,67,0.3)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}>
                        {/* Buyer Header */}
                        <div
                          onClick={() => isMultiOrder && setCollapsedBuyers(prev => ({ ...prev, [buyerName]: !prev[buyerName] }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: isMultiOrder ? 'rgba(255,159,67,0.1)' : 'rgba(255,255,255,0.02)',
                            cursor: isMultiOrder ? 'pointer' : 'default',
                            borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isMultiOrder && (
                              isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />
                            )}
                            <User size={18} style={{ color: isMultiOrder ? '#ff9f43' : '#888' }} />
                            <span style={{ fontWeight: isMultiOrder ? '600' : '400', color: isMultiOrder ? '#ff9f43' : '#ccc' }}>
                              {buyerName}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#888',
                              background: 'rgba(0,0,0,0.3)',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}>
                              {buyerOrders.length} order{buyerOrders.length > 1 ? 's' : ''}
                            </span>
                            {isMultiOrder && (
                              <span style={{
                                fontSize: '0.7rem',
                                color: '#ff9f43',
                                background: 'rgba(255,159,67,0.2)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                Ship Together
                              </span>
                            )}
                          </div>
                          {isMultiOrder && (
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>
                              {buyerOrders.filter(o => o.status === 'fulfilled').length}/{buyerOrders.length} fulfilled
                            </div>
                          )}
                        </div>

                        {/* Buyer's Orders */}
                        {!isCollapsed && (
                          <div style={{ padding: isMultiOrder ? '12px' : '0' }}>
                            <div className="orders-list" style={{ gap: isMultiOrder ? '8px' : undefined }}>
                              {buyerOrders.map(order => (
                                <OrderCard
                                  key={order.orderId}
                                  order={order}
                                  orders={orders}
                                  setOrders={setOrders}
                                  teamMembers={teamMembers}
                                  stores={stores}
                                  printers={printers}
                                  models={models}
                                  filaments={filaments}
                                  externalParts={externalParts}
                                  updateOrderStatus={updateOrderStatus}
                                  initiateFulfillment={initiateFulfillment}
                                  reassignOrder={reassignOrder}
                                  togglePlateComplete={togglePlateComplete}
                                  reprintPart={reprintPart}
                                  deleteReprint={deleteReprint}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Regular view (not grouped)
        return selectedPartnerFilter !== 'all' ? (
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
                    orders={orders}
                    setOrders={setOrders}
                    teamMembers={teamMembers}
                    stores={stores}
                    printers={printers}
                    models={models}
                    filaments={filaments}
                    externalParts={externalParts}
                    updateOrderStatus={updateOrderStatus}
                    initiateFulfillment={initiateFulfillment}
                    reassignOrder={reassignOrder}
                    togglePlateComplete={togglePlateComplete}
                    reprintPart={reprintPart}
                    deleteReprint={deleteReprint}
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
                    orders={orders}
                    setOrders={setOrders}
                    teamMembers={teamMembers}
                    stores={stores}
                    printers={printers}
                    models={models}
                    filaments={filaments}
                    externalParts={externalParts}
                    updateOrderStatus={updateOrderStatus}
                    initiateFulfillment={initiateFulfillment}
                    reassignOrder={reassignOrder}
                    togglePlateComplete={togglePlateComplete}
                    reprintPart={reprintPart}
                    deleteReprint={deleteReprint}
                  />
                ))
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}

// Order Card Component
function OrderCard({ order, orders, setOrders, teamMembers, stores, printers, models, filaments, externalParts, updateOrderStatus, initiateFulfillment, reassignOrder, togglePlateComplete, reprintPart, deleteReprint }) {
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingCostInput, setShippingCostInput] = useState('');
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorUsage, setNewColorUsage] = useState('');
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [reprintData, setReprintData] = useState({ filamentUsage: '', printHours: '0', printMinutes: '0' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});

  const openEditModal = () => {
    setEditData({
      color: order.color || '',
      storeId: order.storeId || '',
      extra: order.extra || '',
      overrideShipByDate: order.overrideShipByDate || ''
    });
    setShowEditModal(true);
  };

  const saveOrderEdit = () => {
    const updated = orders.map(o => {
      if (o.orderId === order.orderId) {
        return {
          ...o,
          color: editData.color,
          storeId: editData.storeId || null,
          extra: editData.extra,
          overrideShipByDate: editData.overrideShipByDate || null
        };
      }
      return o;
    });
    setOrders(updated);
    setShowEditModal(false);
  };

  const addAdditionalColor = () => {
    if (!newColorName || !newColorUsage) return;
    const updated = orders.map(o => {
      if (o.orderId === order.orderId) {
        const additionalColors = [...(o.additionalColors || [])];
        additionalColors.push({
          id: `color-${Date.now()}`,
          color: newColorName,
          filamentUsage: parseFloat(newColorUsage) || 0
        });
        return { ...o, additionalColors };
      }
      return o;
    });
    setOrders(updated);
    setNewColorName('');
    setNewColorUsage('');
    setShowAddColor(false);
  };

  const removeAdditionalColor = (colorId) => {
    const updated = orders.map(o => {
      if (o.orderId === order.orderId) {
        const additionalColors = (o.additionalColors || []).filter(c => c.id !== colorId);
        return { ...o, additionalColors };
      }
      return o;
    });
    setOrders(updated);
  };

  const createReprint = () => {
    if (!reprintData.filamentUsage) return;

    const newOrder = {
      id: `reprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: `REPRINT-${order.orderId.slice(-6)}-${Date.now().toString().slice(-4)}`,
      item: `Reprint: ${order.item}`,
      buyerName: order.buyerName || 'Reprint',
      quantity: 1,
      color: order.color,
      price: '$0.00',
      status: 'received',
      assignedTo: order.assignedTo,
      printerId: order.printerId,
      isExtraPrint: true,
      extraPrintFilament: parseFloat(reprintData.filamentUsage) || 0,
      extraPrintMinutes: (parseInt(reprintData.printHours) || 0) * 60 + (parseInt(reprintData.printMinutes) || 0),
      createdAt: Date.now(),
      storeId: order.storeId,
      originalOrderId: order.orderId,
      notes: `Reprint for order ${order.orderId}`
    };

    setOrders([newOrder, ...orders]);
    setReprintData({ filamentUsage: '', printHours: '0', printMinutes: '0' });
    setShowReprintModal(false);
  };

  const statusIcons = {
    received: <Clock size={14} />,
    fulfilled: <Check size={14} />,
    shipped: <Truck size={14} />
  };

  const store = stores?.find(s => s.id === order.storeId);
  const assignedMember = teamMembers?.find(m => m.id === order.assignedTo);
  const assignedPrinter = printers?.find(p => p.id === order.printerId);

  // Calculate buyer group info for orders from the same buyer
  const buyerGroupInfo = (() => {
    const buyerName = (order.buyerName || '').toLowerCase().trim();
    if (!buyerName || !orders) return null;

    // Find all active orders from the same buyer (not shipped)
    const sameBuyerOrders = orders.filter(o =>
      (o.buyerName || '').toLowerCase().trim() === buyerName &&
      o.status !== 'shipped'
    ).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    if (sameBuyerOrders.length <= 1) return null;

    const position = sameBuyerOrders.findIndex(o => o.orderId === order.orderId) + 1;
    const total = sameBuyerOrders.length;

    // Find other orders from this buyer that haven't shipped yet
    const unshippedSiblings = sameBuyerOrders.filter(o =>
      o.orderId !== order.orderId && o.status !== 'shipped'
    );

    return {
      position,
      total,
      isGrouped: true,
      unshippedSiblings
    };
  })();

  // Find matching model by name/alias AND variant (using Extra field)
  const matchingModel = (() => {
    if (!models) return null;
    const orderItem = (order.item || '').toLowerCase();
    const orderExtra = (order.extra || '').toLowerCase().trim();

    // Helper to check if a model matches the item name
    const matchesName = (m) => {
      const modelName = m.name.toLowerCase();
      if (orderItem.includes(modelName) || modelName.includes(orderItem)) return true;
      if (m.aliases && m.aliases.length > 0) {
        return m.aliases.some(alias => {
          const lowerAlias = alias.toLowerCase();
          return orderItem.includes(lowerAlias) || lowerAlias.includes(orderItem);
        });
      }
      return false;
    };

    // Get all models that match the item name
    const matchingModels = models.filter(matchesName);
    if (matchingModels.length === 0) return null;
    if (matchingModels.length === 1) return matchingModels[0];

    // If there's an extra field, find the best variant match
    if (orderExtra) {
      // First, try to match by variantName (e.g., "Small", "Large")
      const variantByName = matchingModels.find(m => {
        if (!m.variantName) return false;
        const variantLower = m.variantName.toLowerCase();
        return variantLower === orderExtra ||
               variantLower.includes(orderExtra) ||
               orderExtra.includes(variantLower);
      });
      if (variantByName) return variantByName;

      // Then, try to match by external part name
      const variantWithPart = matchingModels.find(m => {
        if (!m.externalParts || m.externalParts.length === 0) return false;
        return m.externalParts.some(part => {
          const partName = part.name.toLowerCase();
          return partName.includes(orderExtra) || orderExtra.includes(partName);
        });
      });
      if (variantWithPart) return variantWithPart;
    }

    // Fall back to base model (no variant) or first match
    const baseModel = matchingModels.find(m =>
      (!m.variantName || m.variantName === '') &&
      (!m.externalParts || m.externalParts.length === 0)
    );
    return baseModel || matchingModels[0];
  })();

  // Calculate profit for this order
  const calculateProfit = () => {
    // Parse revenue from price (remove $ and parse)
    const priceStr = order.price?.replace(/[^0-9.]/g, '') || '0';
    const orderTotal = parseFloat(priceStr) || 0;

    // Etsy fees
    const TRANSACTION_FEE_RATE = 0.065; // 6.5%
    const PAYMENT_PROCESSING_RATE = 0.03; // 3%
    const PAYMENT_PROCESSING_FLAT = 0.25; // $0.25
    const SALES_TAX_RATE = 0.0752; // 7.52% (fallback if no actual tax)

    // Use actual sales tax if available, otherwise estimate from rate
    let salesTax;
    let preTaxAmount;
    if (order.salesTax != null && order.salesTax > 0) {
      // Use actual tax from order
      salesTax = order.salesTax;
      preTaxAmount = orderTotal - salesTax;
    } else {
      // Estimate tax using average rate
      preTaxAmount = orderTotal / (1 + SALES_TAX_RATE);
      salesTax = orderTotal - preTaxAmount;
    }

    // Fees are calculated on the full order total
    const transactionFee = orderTotal * TRANSACTION_FEE_RATE;
    const paymentProcessingFee = (orderTotal * PAYMENT_PROCESSING_RATE) + PAYMENT_PROCESSING_FLAT;
    const totalFees = transactionFee + paymentProcessingFee;

    // Revenue after tax (what you actually keep before other costs)
    const revenue = preTaxAmount;

    // Calculate filament cost
    let filamentCost = 0;
    let noFilamentMatch = false;
    let noRollCost = false;
    let noPlates = false;

    if (matchingModel && order.assignedTo) {
      const orderColor = (order.color || matchingModel.defaultColor || '').toLowerCase().trim();
      const memberFilaments = filaments?.[order.assignedTo] || [];
      const matchedFilament = memberFilaments.find(f => {
        const filColor = f.color.toLowerCase().trim();
        // Match if exact, or if one contains the other (e.g., "Sunla PLA Black" matches "Black")
        return filColor === orderColor ||
               filColor.includes(orderColor) ||
               orderColor.includes(filColor);
      });

      if (!matchedFilament) {
        noFilamentMatch = true;
      } else {
        // For multi-color prints, calculate cost for each color separately
        const printerSettings = matchingModel.printerSettings?.find(ps => ps.printerId === order.printerId) || matchingModel.printerSettings?.[0];

        if (printerSettings?.plates?.length > 0) {
          // Collect filament usage by color from all parts
          const usageByColor = {};
          printerSettings.plates.forEach(plate => {
            if (plate.parts?.length > 0) {
              plate.parts.forEach(part => {
                const partColor = (part.color || order.color || matchingModel.defaultColor || '').toLowerCase().trim();
                const partUsage = parseFloat(part.filamentUsage) || 0;
                if (partColor && partUsage > 0) {
                  usageByColor[partColor] = (usageByColor[partColor] || 0) + partUsage;
                }
              });
            } else if (plate.filamentUsage) {
              // Plate has direct filamentUsage (use order color)
              const plateColor = (order.color || matchingModel.defaultColor || '').toLowerCase().trim();
              usageByColor[plateColor] = (usageByColor[plateColor] || 0) + (parseFloat(plate.filamentUsage) || 0);
            }
          });

          // Calculate cost for each color
          Object.entries(usageByColor).forEach(([color, usage]) => {
            const colorFilament = memberFilaments.find(f => {
              const filColor = f.color.toLowerCase().trim();
              return filColor === color || filColor.includes(color) || color.includes(filColor);
            });
            const colorRollCost = colorFilament?.currentRollCost || colorFilament?.costPerRoll || 0;
            if (colorRollCost > 0) {
              const costPerGram = colorRollCost / 1000;
              filamentCost += usage * costPerGram * order.quantity;
            }
          });

          if (filamentCost <= 0 && Object.keys(usageByColor).length === 0) {
            noPlates = true;
          }
        } else if (matchingModel.filamentUsage) {
          // Fall back to model's direct filamentUsage field with primary color
          const rollCost = matchedFilament?.currentRollCost || matchedFilament?.costPerRoll || 0;
          if (rollCost > 0) {
            const costPerGram = rollCost / 1000;
            filamentCost = parseFloat(matchingModel.filamentUsage) * costPerGram * order.quantity;
          } else {
            noRollCost = true;
          }
        } else {
          noPlates = true;
        }
      }

      // Add costs for additional colors (manually added to order)
      if (order.additionalColors && order.additionalColors.length > 0) {
        order.additionalColors.forEach(addColor => {
          const addColorName = (addColor.color || '').toLowerCase().trim();
          const addMatchedFilament = memberFilaments.find(f => {
            const filColor = f.color.toLowerCase().trim();
            return filColor === addColorName ||
                   filColor.includes(addColorName) ||
                   addColorName.includes(filColor);
          });
          const addRollCost = addMatchedFilament?.currentRollCost || addMatchedFilament?.costPerRoll || 0;
          if (addRollCost > 0) {
            const addCostPerGram = addRollCost / 1000;
            filamentCost += (addColor.filamentUsage || 0) * addCostPerGram * order.quantity;
          }
        });
      }
    }

    // Calculate external parts cost
    let partsCost = 0;
    const memberParts = order.assignedTo ? (externalParts?.[order.assignedTo] || []) : [];

    // Parts from model definition
    if (matchingModel && matchingModel.externalParts?.length > 0) {
      matchingModel.externalParts.forEach(needed => {
        const matchedPart = memberParts.find(p => p.name.toLowerCase() === needed.name.toLowerCase());
        if (matchedPart && matchedPart.costPerUnit > 0) {
          partsCost += matchedPart.costPerUnit * needed.quantity * order.quantity;
        }
      });
    }

    // Parts selected during fulfillment (usedExternalParts)
    if (order.usedExternalParts && typeof order.usedExternalParts === 'object') {
      Object.entries(order.usedExternalParts).forEach(([partName, qty]) => {
        if (qty > 0) {
          const matchedPart = memberParts.find(p => p.name.toLowerCase() === partName.toLowerCase());
          if (matchedPart && matchedPart.costPerUnit > 0) {
            partsCost += matchedPart.costPerUnit * qty;
          }
        }
      });
    }

    // Also check usedExternalPart (singular - older format for single part selection)
    if (order.usedExternalPart && typeof order.usedExternalPart === 'string') {
      const matchedPart = memberParts.find(p => p.name.toLowerCase() === order.usedExternalPart.toLowerCase());
      if (matchedPart && matchedPart.costPerUnit > 0) {
        partsCost += matchedPart.costPerUnit * order.quantity;
      }
    }

    // Shipping cost
    const shippingCost = order.shippingCost || 0;

    // Total cost and profit
    const totalCost = filamentCost + partsCost + shippingCost + totalFees;
    const profit = revenue - totalCost;

    return {
      orderTotal,
      revenue,
      salesTax,
      transactionFee,
      paymentProcessingFee,
      totalFees,
      filamentCost,
      partsCost,
      shippingCost,
      totalCost,
      profit,
      hasData: orderTotal > 0 || totalCost > 0,
      noFilamentMatch,
      noRollCost,
      noPlates
    };
  };

  const profitData = calculateProfit();

  // Update printer for this order
  const updatePrinter = (printerId) => {
    const updated = orders.map(o =>
      (o.id === order.id || o.orderId === order.orderId) ? { ...o, printerId } : o
    );
    setOrders(updated);
  };

  // Handle shipping with cost
  const handleMarkShipped = () => {
    setShowShippingModal(true);
    setShippingCostInput('');
  };

  const confirmShipping = () => {
    updateOrderStatus(order.orderId, 'shipped', shippingCostInput);
    setShowShippingModal(false);
    setShippingCostInput('');
  };

  return (
    <div className="order-card" style={order.assignmentIssue ? {
      borderColor: 'rgba(255, 107, 107, 0.5)',
      boxShadow: '0 0 0 1px rgba(255, 107, 107, 0.3), inset 0 0 20px rgba(255, 107, 107, 0.05)'
    } : {}}>
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
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openEditModal(); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Edit order"
                >
                  <Edit2 size={12} />
                </button>
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
                {order.isReplacement && (
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 159, 67, 0.2)',
                    color: '#ff9f43',
                    border: '1px solid rgba(255, 159, 67, 0.4)',
                    fontWeight: '600'
                  }}>
                    REPLACEMENT
                  </span>
                )}
                {order.isExtraPrint && (
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(165, 94, 234, 0.2)',
                    color: '#a55eea',
                    border: '1px solid rgba(165, 94, 234, 0.4)',
                    fontWeight: '600'
                  }}>
                    EXTRA PRINT
                  </span>
                )}
                {buyerGroupInfo && (
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 159, 67, 0.2)',
                    color: '#ff9f43',
                    border: '1px solid rgba(255, 159, 67, 0.4)',
                    fontWeight: '600'
                  }}>
                    {buyerGroupInfo.position}/{buyerGroupInfo.total}
                  </span>
                )}
              </div>
              <div className="order-item" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>{order.item}</div>
            </div>
            <span
              className={`status-badge status-${order.status}`}
              onClick={() => {
                if (order.status === 'fulfilled') {
                  updateOrderStatus(order.orderId, 'received');
                } else if (order.status === 'shipped') {
                  updateOrderStatus(order.orderId, 'fulfilled');
                }
              }}
              style={order.status !== 'received' ? { cursor: 'pointer' } : {}}
              title={order.status === 'fulfilled' ? 'Click to revert to Received' : order.status === 'shipped' ? 'Click to revert to Fulfilled' : ''}
            >
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
            backgroundColor: order.assignmentIssue ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 193, 7, 0.15)',
            color: order.assignmentIssue ? '#ff6b6b' : '#ffc107',
            border: order.assignmentIssue ? '1px solid rgba(255, 107, 107, 0.4)' : '1px solid rgba(255, 193, 7, 0.3)'
          }}>
            <AlertCircle size={12} />
            {order.assignmentIssue || 'Unassigned'}
          </span>
        )}

        {/* Printer Badge */}
        {assignedPrinter ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 255, 136, 0.15)',
            color: '#00ff88',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            marginLeft: '8px'
          }}>
            <Printer size={12} />
            {assignedPrinter.name}
          </span>
        ) : (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'rgba(136, 136, 136, 0.15)',
            color: '#888',
            border: '1px solid rgba(136, 136, 136, 0.3)',
            marginLeft: '8px'
          }}>
            <Printer size={12} />
            No printer
          </span>
        )}
      </div>

      <div className="order-details">
        <div className="detail-item">
          <span className="detail-label">Buyer</span>
          <span className="detail-value">{order.buyerName || 'Unknown'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Order Date</span>
          <span className="detail-value">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Ship By</span>
          {(() => {
            // Use override if set, otherwise calculate from model processing time
            let shipByDate;
            if (order.overrideShipByDate) {
              shipByDate = new Date(order.overrideShipByDate);
            } else if (matchingModel) {
              shipByDate = calculateShipByDate(order.createdAt, matchingModel.processingDays || 3);
            } else {
              shipByDate = calculateShipByDate(order.createdAt, 3); // Default 3 days
            }
            if (!shipByDate || isNaN(shipByDate.getTime())) return <span className="detail-value">Unknown</span>;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const shipByDay = new Date(shipByDate);
            shipByDay.setHours(0, 0, 0, 0);
            const isOverdue = shipByDay < today;
            const isDueToday = shipByDay.getTime() === today.getTime();
            const isDueTomorrow = shipByDay.getTime() === today.getTime() + 86400000;
            return (
              <span className="detail-value" style={{
                color: isOverdue ? '#ff6b6b' : isDueToday ? '#ffc107' : isDueTomorrow ? '#ffcc00' : 'inherit',
                fontWeight: (isOverdue || isDueToday) ? '600' : 'normal'
              }}>
                {shipByDate.toLocaleDateString()}
                {isOverdue && ' (OVERDUE)'}
                {isDueToday && ' (TODAY)'}
                {isDueTomorrow && ' (Tomorrow)'}
                {order.overrideShipByDate && ' *'}
              </span>
            );
          })()}
        </div>
        <div className="detail-item">
          <span className="detail-label">Quantity</span>
          <span className="detail-value">{order.quantity}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Color</span>
          <span className="detail-value">{order.color || 'Not specified'}</span>
        </div>

        {/* Additional Colors for Multi-Color Prints */}
        {(order.additionalColors && order.additionalColors.length > 0) && (
          <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="detail-label" style={{ marginBottom: '4px' }}>Additional Colors</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {order.additionalColors.map(c => (
                <span key={c.id} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(165, 94, 234, 0.15)',
                  color: '#a55eea',
                  border: '1px solid rgba(165, 94, 234, 0.3)'
                }}>
                  {c.color} ({c.filamentUsage}g)
                  <button
                    onClick={() => removeAdditionalColor(c.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add Color Button */}
        {order.status === 'received' && (
          <div style={{ marginTop: '4px' }}>
            {showAddColor ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Color"
                  value={newColorName}
                  onChange={e => setNewColorName(e.target.value)}
                  style={{
                    width: '80px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(165, 94, 234, 0.3)',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
                <input
                  type="number"
                  placeholder="Grams"
                  value={newColorUsage}
                  onChange={e => setNewColorUsage(e.target.value)}
                  style={{
                    width: '60px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(165, 94, 234, 0.3)',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
                <button
                  onClick={addAdditionalColor}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    background: 'rgba(165, 94, 234, 0.2)',
                    border: '1px solid rgba(165, 94, 234, 0.4)',
                    borderRadius: '4px',
                    color: '#a55eea',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => { setShowAddColor(false); setNewColorName(''); setNewColorUsage(''); }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#888',
                    cursor: 'pointer'
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddColor(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  background: 'rgba(165, 94, 234, 0.1)',
                  border: '1px solid rgba(165, 94, 234, 0.2)',
                  borderRadius: '4px',
                  color: '#a55eea',
                  cursor: 'pointer'
                }}
              >
                <Plus size={12} /> Add Color
              </button>
            )}
          </div>
        )}

        {order.extra && (
          <div className="detail-item">
            <span className="detail-label">Extra</span>
            <span className="detail-value">{order.extra}</span>
          </div>
        )}
        {order.shippingCost != null && order.shippingCost > 0 && (
          <div className="detail-item">
            <span className="detail-label">Shipping</span>
            <span className="detail-value" style={{ color: '#ff6b6b' }}>${order.shippingCost.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Buyer Message */}
      {order.buyerMessage && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          background: 'rgba(255, 193, 7, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 193, 7, 0.3)'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#ffc107', marginBottom: '4px', fontWeight: '600' }}>
            Message from Buyer
          </div>
          <div style={{ fontSize: '0.85rem', color: '#e0e0e0', whiteSpace: 'pre-wrap' }}>
            {order.buyerMessage}
          </div>
        </div>
      )}

      {/* Profit Calculator Display */}
      {profitData.hasData && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          background: profitData.profit >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)',
          borderRadius: '8px',
          border: `1px solid ${profitData.profit >= 0 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>
              <TrendingUp size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Profit Analysis
            </span>
            <span style={{
              fontWeight: '600',
              fontSize: '1rem',
              color: profitData.profit >= 0 ? '#00ff88' : '#ff6b6b'
            }}>
              {profitData.profit >= 0 ? '+' : ''}${profitData.profit.toFixed(2)}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {profitData.orderTotal > 0 && <span>Order: ${profitData.orderTotal.toFixed(2)}</span>}
            {profitData.salesTax > 0 && <span style={{ color: '#888' }}>Tax: -${profitData.salesTax.toFixed(2)}</span>}
            {profitData.totalFees > 0 && <span style={{ color: '#ff9f43' }}>Fees: -${profitData.totalFees.toFixed(2)}</span>}
            <span style={{ color: profitData.filamentCost > 0 ? '#a55eea' : '#555' }}>
              Material: {profitData.filamentCost > 0 ? `-$${profitData.filamentCost.toFixed(2)}` : '$0'}
              {profitData.filamentCost === 0 && !matchingModel && ' (no model match)'}
              {profitData.filamentCost === 0 && matchingModel && !order.assignedTo && ' (unassigned)'}
              {profitData.filamentCost === 0 && matchingModel && order.assignedTo && profitData.noFilamentMatch && ` (no "${order.color}" filament)`}
              {profitData.filamentCost === 0 && matchingModel && order.assignedTo && profitData.noRollCost && ' (filament has no cost)'}
              {profitData.filamentCost === 0 && matchingModel && order.assignedTo && profitData.noPlates && ' (no filament usage set)'}
            </span>
            {profitData.partsCost > 0 && <span style={{ color: '#00ccff' }}>Parts: -${profitData.partsCost.toFixed(2)}</span>}
            {profitData.shippingCost > 0 && <span>Ship: -${profitData.shippingCost.toFixed(2)}</span>}
          </div>
        </div>
      )}

      {/* Plate Completion Tracker */}
      {(() => {
        const printerSettings = matchingModel?.printerSettings?.find(ps => ps.printerId === order.printerId) || matchingModel?.printerSettings?.[0];
        const plates = printerSettings?.plates || [];
        if (plates.length === 0 || order.status !== 'received') return null;

        const completedPlates = order.completedPlates || [];
        const plateColors = order.plateColors || {};
        const plateReprints = order.plateReprints || [];
        const completedCount = completedPlates.length;
        const totalPlates = plates.length;
        const allPlatesComplete = completedCount === totalPlates;

        // Get available colors from assigned member's filament inventory
        const memberFilaments = filaments[order.assignedTo] || [];
        const availableColors = memberFilaments.map(f => f.color);

        // Calculate plate totals from parts
        const getPlateTotals = (plate) => {
          if (!plate?.parts?.length) {
            // Fallback for legacy plates without parts
            return {
              totalFilament: parseFloat(plate.filamentUsage) || 0,
              totalMinutes: ((parseInt(plate.printHours) || 0) * 60) + (parseInt(plate.printMinutes) || 0)
            };
          }

          // Calculate filament from parts (always sum)
          const totalFilament = plate.parts.reduce((sum, part) => {
            const qty = parseInt(part.quantity) || 1;
            return sum + ((parseFloat(part.filamentUsage) || 0) * qty);
          }, 0);

          // Use actual plate time if set, otherwise sum from parts
          const hasActualTime = (plate.actualPrintHours && parseInt(plate.actualPrintHours) > 0) ||
                                (plate.actualPrintMinutes && parseInt(plate.actualPrintMinutes) > 0);

          let totalMinutes;
          if (hasActualTime) {
            totalMinutes = ((parseInt(plate.actualPrintHours) || 0) * 60) + (parseInt(plate.actualPrintMinutes) || 0);
          } else {
            totalMinutes = plate.parts.reduce((sum, part) => {
              const qty = parseInt(part.quantity) || 1;
              return sum + (((parseInt(part.printHours) || 0) * 60) + (parseInt(part.printMinutes) || 0)) * qty;
            }, 0);
          }

          return { totalFilament, totalMinutes };
        };

        const isPlatesCollapsed = order.platesCollapsed ?? true;

        const togglePlatesCollapsed = () => {
          const updatedOrders = orders.map(o =>
            o.orderId === order.orderId ? { ...o, platesCollapsed: !(o.platesCollapsed ?? true) } : o
          );
          setOrders(updatedOrders);
        };

        return (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            background: allPlatesComplete ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 204, 255, 0.1)',
            borderRadius: '8px',
            border: `1px solid ${allPlatesComplete ? 'rgba(0, 255, 136, 0.3)' : 'rgba(0, 204, 255, 0.3)'}`
          }}>
            <div
              onClick={togglePlatesCollapsed}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: isPlatesCollapsed ? '0' : '8px'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isPlatesCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <Printer size={12} />
                Plates
              </span>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                color: allPlatesComplete ? '#00ff88' : '#00ccff'
              }}>
                {completedCount}/{totalPlates} complete
              </span>
            </div>
            {!isPlatesCollapsed && <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {plates.map((plate, idx) => {
                const isComplete = completedPlates.includes(idx);
                const plateTotals = getPlateTotals(plate);
                const plateFilament = plateTotals.totalFilament * order.quantity;
                const plateTime = `${Math.floor(plateTotals.totalMinutes / 60)}h ${plateTotals.totalMinutes % 60}m`;
                // Check if any part in this plate is multi-color
                const multiColorParts = (plate.parts || []).filter(part => part.isMultiColor);
                const hasMultiColorPart = multiColorParts.length > 0;
                const completedColor = plateColors[idx];
                const hasParts = (plate.parts?.length || 0) > 0;
                const plateReprintsForThis = plateReprints.filter(r => r.plateIndex === idx);
                // Track expanded state for this plate using order's expandedPlates
                const isExpanded = (order.expandedPlates || []).includes(idx);

                const toggleExpanded = () => {
                  const currentExpanded = order.expandedPlates || [];
                  const newExpanded = currentExpanded.includes(idx)
                    ? currentExpanded.filter(i => i !== idx)
                    : [...currentExpanded, idx];
                  const updatedOrders = orders.map(o =>
                    o.orderId === order.orderId ? { ...o, expandedPlates: newExpanded } : o
                  );
                  setOrders(updatedOrders);
                };

                return (
                  <div key={idx}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        background: isComplete
                          ? 'rgba(0, 255, 136, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Checkbox for all plates */}
                      <input
                        type="checkbox"
                        checked={isComplete}
                        onClick={() => {
                          if (hasMultiColorPart && !isComplete) {
                            // For multi-color plates, need to select color first - expand the dropdown
                            if (!isExpanded) toggleExpanded();
                          } else if (!isComplete) {
                            // For non-multi-color plates, auto-complete with order color for all parts
                            const allParts = plate.parts || [];
                            const orderColor = order.color || matchingModel?.defaultColor || '';
                            const partColors = {};
                            allParts.forEach((_, partIdx) => {
                              partColors[partIdx] = orderColor;
                            });
                            togglePlateComplete(order.orderId, idx, matchingModel, partColors);
                          } else {
                            // Uncompleting - pass stored colors
                            togglePlateComplete(order.orderId, idx, matchingModel, completedColor || null);
                          }
                        }}
                        readOnly
                        style={{ cursor: 'pointer' }}
                      />

                      {/* Plate name */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: '0.8rem',
                          color: isComplete ? '#00ff88' : '#e0e0e0',
                          textDecoration: isComplete ? 'line-through' : 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (hasMultiColorPart && !isComplete) {
                            if (!isExpanded) toggleExpanded();
                          } else if (!isComplete) {
                            // For non-multi-color plates, auto-complete with order color for all parts
                            const allParts = plate.parts || [];
                            const orderColor = order.color || matchingModel?.defaultColor || '';
                            const partColors = {};
                            allParts.forEach((_, partIdx) => {
                              partColors[partIdx] = orderColor;
                            });
                            togglePlateComplete(order.orderId, idx, matchingModel, partColors);
                          } else {
                            // Uncompleting - pass stored colors
                            togglePlateComplete(order.orderId, idx, matchingModel, completedColor || null);
                          }
                        }}
                      >
                        {plate.name || `Plate ${idx + 1}`}
                      </span>

                      {/* Show completed colors badge if multi-color and complete */}
                      {isComplete && hasMultiColorPart && completedColor && (() => {
                        // completedColor is now an object { partIndex: color }
                        const colors = typeof completedColor === 'object'
                          ? [...new Set(Object.values(completedColor))].filter(c => c)
                          : [completedColor];
                        return colors.length > 0 && (
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            background: 'rgba(165, 94, 234, 0.2)',
                            border: '1px solid rgba(165, 94, 234, 0.3)',
                            borderRadius: '4px',
                            color: '#a55eea'
                          }}>
                            {colors.join(', ')}
                          </span>
                        );
                      })()}

                      {/* Stats */}
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>
                        {plateFilament.toFixed(2)}g{!isComplete && ` • ${plateTime}`}
                      </span>

                      {/* Expand arrow for plates with multi-color parts */}
                      {hasMultiColorPart && !isComplete && (
                        <button
                          onClick={toggleExpanded}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: '#a55eea',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Expand to select colors"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}

                      {isComplete && <Check size={14} style={{ color: '#00ff88' }} />}
                    </div>

                    {/* Expanded section for parts - shows all parts with color selection */}
                    {hasMultiColorPart && !isComplete && isExpanded && (() => {
                      const allParts = plate.parts || [];
                      const pendingColors = order.pendingPartColors?.[idx] || {};
                      const orderColor = order.color || matchingModel?.defaultColor || '';

                      // Check if all multi-color parts have colors selected
                      const allMultiColorPartsHaveColors = allParts.every((part, partIdx) =>
                        !part.isMultiColor || pendingColors[partIdx]
                      );

                      const updatePendingColor = (partIdx, color) => {
                        const currentPending = order.pendingPartColors || {};
                        const platePending = { ...(currentPending[idx] || {}) };
                        platePending[partIdx] = color;
                        const updatedOrders = orders.map(o =>
                          o.orderId === order.orderId
                            ? { ...o, pendingPartColors: { ...currentPending, [idx]: platePending } }
                            : o
                        );
                        setOrders(updatedOrders);
                      };

                      const completePlateWithColors = () => {
                        // Build partColors object for all parts
                        const partColors = {};
                        allParts.forEach((part, partIdx) => {
                          if (part.isMultiColor) {
                            partColors[partIdx] = pendingColors[partIdx] || '';
                          } else {
                            partColors[partIdx] = orderColor;
                          }
                        });
                        togglePlateComplete(order.orderId, idx, matchingModel, partColors);
                        // Note: Don't call setOrders here - togglePlateComplete already updates orders via saveOrders
                      };

                      return (
                        <div style={{
                          marginLeft: '24px',
                          marginTop: '4px',
                          padding: '8px',
                          background: 'rgba(165, 94, 234, 0.1)',
                          borderRadius: '6px',
                          border: '1px solid rgba(165, 94, 234, 0.2)'
                        }}>
                          <div style={{ fontSize: '0.7rem', color: '#a55eea', marginBottom: '8px' }}>
                            Part colors:
                          </div>
                          {allParts.map((part, partIdx) => {
                            const partQty = parseInt(part.quantity) || 1;
                            const partFilament = (parseFloat(part.filamentUsage) || 0) * partQty;
                            return (
                              <div key={partIdx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '6px'
                              }}>
                                <Palette size={12} style={{ color: part.isMultiColor ? '#a55eea' : '#888' }} />
                                <span style={{ fontSize: '0.8rem', color: '#e0e0e0', flex: 1 }}>
                                  {part.name || `Part ${partIdx + 1}`}
                                  {partQty > 1 && <span style={{ color: '#888' }}> x{partQty}</span>}
                                  <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: '4px' }}>
                                    ({partFilament.toFixed(1)}g)
                                  </span>
                                </span>
                                {part.isMultiColor ? (
                                  <select
                                    value={pendingColors[partIdx] || ''}
                                    onChange={(e) => updatePendingColor(partIdx, e.target.value)}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.75rem',
                                      background: pendingColors[partIdx] ? 'rgba(0, 255, 136, 0.2)' : 'rgba(165, 94, 234, 0.2)',
                                      border: `1px solid ${pendingColors[partIdx] ? 'rgba(0, 255, 136, 0.4)' : 'rgba(165, 94, 234, 0.4)'}`,
                                      borderRadius: '4px',
                                      color: '#fff',
                                      cursor: 'pointer',
                                      minWidth: '120px'
                                    }}
                                  >
                                    <option value="">Select color...</option>
                                    {availableColors.map(color => (
                                      <option key={color} value={color}>{color}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    background: 'rgba(0, 204, 255, 0.15)',
                                    border: '1px solid rgba(0, 204, 255, 0.3)',
                                    borderRadius: '4px',
                                    color: '#00ccff'
                                  }}>
                                    {orderColor || 'No color set'}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          <button
                            onClick={completePlateWithColors}
                            disabled={!allMultiColorPartsHaveColors}
                            style={{
                              marginTop: '8px',
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              background: allMultiColorPartsHaveColors ? 'rgba(0, 255, 136, 0.2)' : 'rgba(128, 128, 128, 0.2)',
                              border: `1px solid ${allMultiColorPartsHaveColors ? 'rgba(0, 255, 136, 0.4)' : 'rgba(128, 128, 128, 0.3)'}`,
                              borderRadius: '4px',
                              color: allMultiColorPartsHaveColors ? '#00ff88' : '#888',
                              cursor: allMultiColorPartsHaveColors ? 'pointer' : 'not-allowed',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Check size={14} />
                            Complete Plate
                          </button>
                        </div>
                      );
                    })()}

                    {/* Reprint Part Section - only show for completed plates with parts */}
                    {isComplete && hasParts && (
                      <div style={{
                        marginLeft: '24px',
                        marginTop: '4px',
                        padding: '6px 8px',
                        background: 'rgba(255, 159, 67, 0.1)',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 159, 67, 0.2)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <RefreshCw size={12} style={{ color: '#ff9f43' }} />
                          <span style={{ fontSize: '0.7rem', color: '#ff9f43' }}>Reprint:</span>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const [partIdx, color] = e.target.value.split('|');
                              if (partIdx && color) {
                                reprintPart(order.orderId, idx, parseInt(partIdx), color, matchingModel);
                                e.target.value = '';
                              }
                            }}
                            style={{
                              padding: '3px 6px',
                              fontSize: '0.7rem',
                              background: 'rgba(255, 159, 67, 0.2)',
                              border: '1px solid rgba(255, 159, 67, 0.4)',
                              borderRadius: '4px',
                              color: '#fff',
                              cursor: 'pointer',
                              flex: 1,
                              minWidth: '120px'
                            }}
                          >
                            <option value="">Select part & color...</option>
                            {plate.parts.map((part, partIdx) => (
                              <optgroup key={partIdx} label={`${part.name} (${part.filamentUsage}g)`}>
                                {availableColors.map(color => (
                                  <option key={`${partIdx}-${color}`} value={`${partIdx}|${color}`}>
                                    {part.name} → {color}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                        {/* Show reprint history for this plate */}
                        {plateReprintsForThis.length > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '0.65rem', color: '#888' }}>
                            Reprints: {plateReprintsForThis.map((r, i) => (
                              <span key={r.id || i} style={{
                                background: 'rgba(255, 159, 67, 0.15)',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                marginLeft: i > 0 ? '4px' : '2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                {r.partName} ({r.color})
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteReprint(order.orderId, r.id, r);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0 2px',
                                    cursor: 'pointer',
                                    color: '#ff6b6b',
                                    fontSize: '0.7rem',
                                    lineHeight: 1,
                                    marginLeft: '2px'
                                  }}
                                  title="Delete reprint"
                                >
                                  x
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>}
          </div>
        );
      })()}

      <div className="order-actions" style={{ marginTop: 'auto' }}>
        {/* Open 3MF Button */}
        {matchingModel?.file3mfUrl && (
          <button
            className="btn btn-primary btn-small"
            title={matchingModel.file3mfUrl.startsWith('http') ? 'Open file' : 'Copy path to clipboard'}
            style={{ marginRight: '8px' }}
            onClick={() => {
              if (matchingModel.file3mfUrl.startsWith('http')) {
                window.open(matchingModel.file3mfUrl, '_blank');
              } else {
                navigator.clipboard.writeText(matchingModel.file3mfUrl);
                alert('Path copied! Use ⌘+Shift+G in Finder to open.');
              }
            }}
          >
            <Printer size={14} /> {matchingModel.file3mfUrl.startsWith('http') ? 'Open 3MF' : 'Copy Path'}
          </button>
        )}

        {/* Printer Selector */}
        <select
          className="assign-select"
          value={order.printerId || ''}
          onChange={e => updatePrinter(e.target.value || null)}
          style={{ marginRight: '8px' }}
        >
          <option value="">Select Printer</option>
          {printers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

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
        
        {order.status === 'received' && (() => {
          const printerSettings = matchingModel?.printerSettings?.find(ps => ps.printerId === order.printerId) || matchingModel?.printerSettings?.[0];
          const plates = printerSettings?.plates || [];
          const hasPlates = plates.length > 0;
          const completedPlates = order.completedPlates || [];
          const allPlatesComplete = !hasPlates || completedPlates.length === plates.length;

          return (
            <button
              className="btn btn-secondary btn-small"
              onClick={() => initiateFulfillment(order.orderId)}
              disabled={!allPlatesComplete}
              title={!allPlatesComplete ? `Complete all ${plates.length} plates to fulfill` : ''}
              style={!allPlatesComplete ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Check size={16} /> {!allPlatesComplete ? `${completedPlates.length}/${plates.length} Plates` : 'Mark Fulfilled'}
            </button>
          );
        })()}
        {order.status === 'fulfilled' && (
          <button
            className="btn btn-primary btn-small"
            onClick={handleMarkShipped}
          >
            <Truck size={16} /> Mark Shipped
          </button>
        )}
        {order.status === 'shipped' && (
          <span style={{ fontSize: '0.8rem', color: '#888' }}>
            Will auto-archive in 2 days
          </span>
        )}

        {/* Reprint Button - available for all statuses */}
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setShowReprintModal(true)}
          style={{ marginLeft: '8px', background: 'rgba(255, 159, 67, 0.15)', borderColor: 'rgba(255, 159, 67, 0.3)', color: '#ff9f43' }}
          title="Create a reprint for this order"
        >
          <RefreshCw size={14} /> Reprint
        </button>
      </div>

      {/* Reprint Modal */}
      {showReprintModal && (
        <div className="modal-overlay" onClick={() => setShowReprintModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3><RefreshCw size={20} /> Create Reprint</h3>
              <button className="close-btn" onClick={() => setShowReprintModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#aaa' }}>
                Creating reprint for: <strong>{order.item}</strong>
              </p>
              <p style={{ marginBottom: '16px', fontSize: '0.85rem', color: '#888' }}>
                Color: {order.color || 'Not specified'} • Assigned: {teamMembers?.find(m => m.id === order.assignedTo)?.name || 'Unassigned'}
              </p>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Filament Usage (grams) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter filament usage"
                  value={reprintData.filamentUsage}
                  onChange={e => setReprintData({ ...reprintData, filamentUsage: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Print Time</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Hours"
                    value={reprintData.printHours}
                    onChange={e => setReprintData({ ...reprintData, printHours: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Minutes"
                    value={reprintData.printMinutes}
                    onChange={e => setReprintData({ ...reprintData, printMinutes: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowReprintModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={createReprint}
                disabled={!reprintData.filamentUsage}
                style={{ background: 'linear-gradient(135deg, #ff9f43 0%, #ee5a24 100%)' }}
              >
                <RefreshCw size={16} /> Create Reprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Cost Modal */}
      {showShippingModal && (
        <div className="modal-overlay" onClick={() => setShowShippingModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3><Truck size={20} /> Mark as Shipped</h3>
              <button className="close-btn" onClick={() => setShowShippingModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#aaa' }}>
                Order: <strong>{order.orderId}</strong>
              </p>
              {buyerGroupInfo && buyerGroupInfo.unshippedSiblings.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  background: 'rgba(255, 159, 67, 0.15)',
                  border: '1px solid rgba(255, 159, 67, 0.4)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <AlertCircle size={20} style={{ color: '#ff9f43', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: '#ff9f43', marginBottom: '4px' }}>
                      Group Order Alert
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                      This buyer has {buyerGroupInfo.unshippedSiblings.length} other order{buyerGroupInfo.unshippedSiblings.length > 1 ? 's' : ''} that should ship together:
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {buyerGroupInfo.unshippedSiblings.map(sibling => (
                        <div key={sibling.orderId} style={{
                          fontSize: '0.8rem',
                          padding: '4px 8px',
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '4px',
                          color: '#fff'
                        }}>
                          {sibling.orderId} - {sibling.item?.substring(0, 30)}{sibling.item?.length > 30 ? '...' : ''}
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: sibling.status === 'fulfilled' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 193, 7, 0.2)',
                            color: sibling.status === 'fulfilled' ? '#00ff88' : '#ffc107'
                          }}>
                            {sibling.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Shipping Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter shipping cost"
                  value={shippingCostInput}
                  onChange={e => setShippingCostInput(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmShipping();
                    if (e.key === 'Escape') setShowShippingModal(false);
                  }}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowShippingModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmShipping}>
                <Truck size={16} /> Confirm Shipped
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3><Edit2 size={20} /> Edit Order</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#aaa' }}>
                Order: <strong>{order.orderId}</strong> - {order.item}
              </p>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Color</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.color}
                  onChange={e => setEditData({ ...editData, color: e.target.value })}
                  placeholder="Enter color"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Store</label>
                <select
                  className="form-input"
                  value={editData.storeId}
                  onChange={e => setEditData({ ...editData, storeId: e.target.value })}
                >
                  <option value="">No Store</option>
                  {stores?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Extra/Variant</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.extra}
                  onChange={e => setEditData({ ...editData, extra: e.target.value })}
                  placeholder="e.g., Small, LED, Rechargeable"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Override Ship By Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editData.overrideShipByDate}
                  onChange={e => setEditData({ ...editData, overrideShipByDate: e.target.value })}
                />
                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                  Leave empty to use calculated date from model processing time
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveOrderEdit}>
                <Check size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [newFilament, setNewFilament] = useState({ color: '', amount: '', colorHex: '#ffffff', rollCost: '', reorderAt: '250' });
  const [editingFilament, setEditingFilament] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [addingRollTo, setAddingRollTo] = useState(null); // {memberId, filamentId}
  const [newRollCost, setNewRollCost] = useState('');
  const [sortBy, setSortBy] = useState('custom'); // 'custom', 'alpha', 'most', 'least'
  const ROLL_SIZE = 1000; // grams per roll

  // Sort filaments based on selected sort option
  const sortFilaments = (filamentList) => {
    if (!filamentList || filamentList.length === 0) return [];
    const sorted = [...filamentList];
    switch (sortBy) {
      case 'alpha':
        return sorted.sort((a, b) => a.color.localeCompare(b.color));
      case 'most':
        return sorted.sort((a, b) => {
          const aTotal = a.amount + ((a.backupRolls?.length || 0) * ROLL_SIZE);
          const bTotal = b.amount + ((b.backupRolls?.length || 0) * ROLL_SIZE);
          return bTotal - aTotal;
        });
      case 'least':
        return sorted.sort((a, b) => {
          const aTotal = a.amount + ((a.backupRolls?.length || 0) * ROLL_SIZE);
          const bTotal = b.amount + ((b.backupRolls?.length || 0) * ROLL_SIZE);
          return aTotal - bTotal;
        });
      case 'custom':
      default:
        return sorted.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
  };

  // Move filament up in custom order
  const moveFilament = (memberId, filamentId, direction) => {
    const memberFilaments = [...(filaments[memberId] || [])];
    const idx = memberFilaments.findIndex(f => f.id === filamentId);
    if (idx < 0) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= memberFilaments.length) return;

    // Swap positions
    [memberFilaments[idx], memberFilaments[newIdx]] = [memberFilaments[newIdx], memberFilaments[idx]];

    // Update sortOrder for all
    memberFilaments.forEach((f, i) => {
      f.sortOrder = i;
    });

    saveFilaments({ ...filaments, [memberId]: memberFilaments });
  };

  const needsRestock = (fil) => {
    const threshold = fil.reorderAt ?? 250;
    return fil.amount <= threshold && (fil.backupRolls || []).length === 0;
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
      // Adding to existing color - add as a backup roll with cost
      const cost = parseFloat(newFilament.rollCost) || 0;
      const backupRolls = [...(memberFilaments[existing].backupRolls || [])];
      backupRolls.push({
        id: `roll-${Date.now()}`,
        cost: cost,
        addedAt: Date.now()
      });
      memberFilaments[existing] = {
        ...memberFilaments[existing],
        amount: memberFilaments[existing].amount + parseFloat(newFilament.amount),
        backupRolls: backupRolls
      };
      if (newFilament.reorderAt) {
        memberFilaments[existing].reorderAt = parseInt(newFilament.reorderAt);
      }
    } else {
      // New filament color
      memberFilaments.push({
        id: Date.now().toString(),
        color: newFilament.color,
        colorHex: newFilament.colorHex,
        amount: parseFloat(newFilament.amount),
        currentRollCost: parseFloat(newFilament.rollCost) || 0,
        backupRolls: [],
        reorderAt: parseInt(newFilament.reorderAt) || 250
      });
    }

    saveFilaments({ ...filaments, [memberId]: memberFilaments });
    setNewFilament({ color: '', amount: '', colorHex: '#ffffff', rollCost: '', reorderAt: '250' });
    showNotification('Filament added successfully');
  };

  const updateAmount = (memberId, filamentId, delta) => {
    const memberFilaments = [...(filaments[memberId] || [])];
    const idx = memberFilaments.findIndex(f => f.id === filamentId);
    if (idx >= 0) {
      let newAmount = memberFilaments[idx].amount + delta;
      let backupRolls = [...(memberFilaments[idx].backupRolls || [])];
      let currentRollCost = memberFilaments[idx].currentRollCost || 0;

      // If amount goes to 0 or below and we have backup rolls, switch to new roll
      if (newAmount <= 0 && backupRolls.length > 0) {
        const nextRoll = backupRolls.shift(); // Get first backup roll
        currentRollCost = nextRoll.cost;
        newAmount = ROLL_SIZE + newAmount; // Add remaining to new roll (newAmount is negative or 0)
        showNotification(`Switched to new roll of ${memberFilaments[idx].color} ($${currentRollCost.toFixed(2)})! ${backupRolls.length} backup roll${backupRolls.length !== 1 ? 's' : ''} remaining.`);
      }

      memberFilaments[idx] = {
        ...memberFilaments[idx],
        amount: Math.max(0, newAmount),
        backupRolls: backupRolls,
        currentRollCost: currentRollCost
      };
      saveFilaments({ ...filaments, [memberId]: memberFilaments });
    }
  };

  const addRoll = (memberId, filamentId, cost) => {
    const memberFilaments = [...(filaments[memberId] || [])];
    const idx = memberFilaments.findIndex(f => f.id === filamentId);
    if (idx >= 0) {
      const backupRolls = [...(memberFilaments[idx].backupRolls || [])];
      backupRolls.push({
        id: `roll-${Date.now()}`,
        cost: parseFloat(cost) || 0,
        addedAt: Date.now()
      });
      memberFilaments[idx] = {
        ...memberFilaments[idx],
        backupRolls: backupRolls
      };
      saveFilaments({ ...filaments, [memberId]: memberFilaments });
      showNotification(`Added backup roll ($${parseFloat(cost).toFixed(2)})`);
    }
    setAddingRollTo(null);
    setNewRollCost('');
  };

  const removeRoll = (memberId, filamentId, rollId) => {
    const memberFilaments = [...(filaments[memberId] || [])];
    const idx = memberFilaments.findIndex(f => f.id === filamentId);
    if (idx >= 0) {
      const backupRolls = (memberFilaments[idx].backupRolls || []).filter(r => r.id !== rollId);
      memberFilaments[idx] = {
        ...memberFilaments[idx],
        backupRolls: backupRolls
      };
      saveFilaments({ ...filaments, [memberId]: memberFilaments });
      showNotification('Removed backup roll');
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
        currentRollCost: parseFloat(editingFilament.currentRollCost) || 0,
        backupRolls: editingFilament.backupRolls || [],
        reorderAt: parseInt(editingFilament.reorderAt) || 250
      };
      saveFilaments({ ...filaments, [editingMemberId]: memberFilaments });
      showNotification('Filament updated');
    }
    setEditingFilament(null);
    setEditingMemberId(null);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        <h2 className="page-title" style={{ margin: 0 }}><Palette size={28} /> Filament Inventory</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <option value="custom">Custom Order</option>
            <option value="alpha">Alphabetical</option>
            <option value="most">Most Stock</option>
            <option value="least">Least Stock</option>
          </select>
        </div>
      </div>

      <div className="inventory-grid">
        {teamMembers.map(member => (
          <div key={member.id} className="inventory-card">
            <h3><Palette size={20} style={{ color: '#00ff88' }} /> {member.name}</h3>
            
            <div className="inventory-items">
              {(filaments[member.id] || []).length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>No filament added</p>
              ) : (
                sortFilaments(filaments[member.id] || []).map((fil, filIdx, sortedList) => {
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
                          {fil.currentRollCost > 0 && (
                            <span style={{ color: '#00ff88', marginLeft: '8px' }}>
                              (${fil.currentRollCost.toFixed(2)} roll)
                            </span>
                          )}
                          <span style={{ color: '#888', marginLeft: '8px' }}>
                            | reorder at {fil.reorderAt ?? 250}g
                          </span>
                        </div>
                        {(fil.backupRolls || []).length > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                            <span style={{ color: '#00ccff' }}>
                              {fil.backupRolls.length} backup roll{fil.backupRolls.length !== 1 ? 's' : ''}:
                            </span>
                            <span style={{ color: '#888', marginLeft: '6px' }}>
                              {fil.backupRolls.map((r, i) => (
                                <span key={r.id} style={{ marginRight: '8px' }}>
                                  ${r.cost.toFixed(2)}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeRoll(member.id, fil.id, r.id); }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ff6b6b',
                                      cursor: 'pointer',
                                      padding: '0 2px',
                                      fontSize: '0.7rem',
                                      marginLeft: '2px'
                                    }}
                                    title="Remove this roll"
                                  >
                                    <X size={10} />
                                  </button>
                                  {i < fil.backupRolls.length - 1 ? ',' : ''}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {sortBy === 'custom' && (
                          <>
                            <button
                              className="qty-btn"
                              onClick={() => moveFilament(member.id, fil.id, 'up')}
                              title="Move up"
                              disabled={filIdx === 0}
                              style={{ opacity: filIdx === 0 ? 0.3 : 1 }}
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              className="qty-btn"
                              onClick={() => moveFilament(member.id, fil.id, 'down')}
                              title="Move down"
                              disabled={filIdx === sortedList.length - 1}
                              style={{ opacity: filIdx === sortedList.length - 1 ? 0.3 : 1 }}
                            >
                              <ChevronDown size={14} />
                            </button>
                          </>
                        )}
                        <button className="qty-btn" onClick={() => startEdit(member.id, fil)} title="Edit filament">
                          <Edit2 size={14} />
                        </button>
                        <button className="qty-btn" onClick={() => removeFilament(member.id, fil.id)} title="Remove filament">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="inventory-item-controls" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
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
                        {addingRollTo?.memberId === member.id && addingRollTo?.filamentId === fil.id ? (
                          <>
                            <span style={{ fontSize: '0.75rem', color: '#888' }}>$</span>
                            <input
                              type="number"
                              placeholder="Cost"
                              value={newRollCost}
                              onChange={e => setNewRollCost(e.target.value)}
                              style={{
                                width: '70px',
                                padding: '4px 8px',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(0, 204, 255, 0.4)',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '0.85rem'
                              }}
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') addRoll(member.id, fil.id, newRollCost);
                                if (e.key === 'Escape') { setAddingRollTo(null); setNewRollCost(''); }
                              }}
                            />
                            <button
                              className="qty-btn"
                              onClick={() => addRoll(member.id, fil.id, newRollCost)}
                              style={{ background: 'rgba(0, 255, 136, 0.2)' }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="qty-btn"
                              onClick={() => { setAddingRollTo(null); setNewRollCost(''); }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setAddingRollTo({ memberId: member.id, filamentId: fil.id })}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              background: 'rgba(0, 204, 255, 0.15)',
                              border: '1px solid rgba(0, 204, 255, 0.3)',
                              borderRadius: '6px',
                              color: '#00ccff',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            <Plus size={12} /> Add Roll
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );})
              )}
            </div>

            <div className="add-item-form" style={{
              background: 'rgba(0, 255, 136, 0.05)',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid rgba(0, 255, 136, 0.2)'
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#00ff88', marginBottom: '12px' }}>
                <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Add New Filament
              </div>

              {/* Color Name + Color Picker */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.8rem' }}>Color Name</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="add-item-input"
                    placeholder="e.g., Sage Green, Matte Black"
                    value={newFilament.color}
                    onChange={e => setNewFilament({ ...newFilament, color: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', fontSize: '0.95rem' }}
                  />
                  <input
                    type="color"
                    value={newFilament.colorHex}
                    onChange={e => setNewFilament({ ...newFilament, colorHex: e.target.value })}
                    style={{ width: '50px', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}
                    title="Pick display color"
                  />
                </div>
              </div>

              {/* Other fields in a grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.8rem' }}>Amount (grams)</label>
                  <input
                    type="number"
                    className="add-item-input"
                    placeholder="e.g., 850"
                    value={newFilament.amount}
                    onChange={e => setNewFilament({ ...newFilament, amount: e.target.value })}
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.8rem' }}>Roll Cost ($)</label>
                  <input
                    type="number"
                    className="add-item-input"
                    placeholder="e.g., 22.99"
                    value={newFilament.rollCost}
                    onChange={e => setNewFilament({ ...newFilament, rollCost: e.target.value })}
                    style={{ width: '100%', padding: '10px' }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.8rem' }}>Reorder At (g)</label>
                  <input
                    type="number"
                    className="add-item-input"
                    placeholder="e.g., 250"
                    title="Alert when amount falls to this level with 0 backup rolls"
                    value={newFilament.reorderAt}
                    onChange={e => setNewFilament({ ...newFilament, reorderAt: e.target.value })}
                    style={{ width: '100%', padding: '10px' }}
                    min="0"
                  />
                </div>
              </div>

              <button className="btn btn-primary" onClick={() => addFilament(member.id)} style={{ width: '100%' }}>
                <Plus size={16} /> Add Filament
              </button>
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
              <label className="form-label">Current Roll Cost ($)</label>
              <input
                type="number"
                className="form-input"
                value={editingFilament.currentRollCost || ''}
                onChange={e => setEditingFilament({ ...editingFilament, currentRollCost: e.target.value })}
                min="0"
                step="0.01"
                placeholder="Cost of the roll currently in use"
              />
              {editingFilament.currentRollCost > 0 && (
                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                  Cost per gram: ${(editingFilament.currentRollCost / 1000).toFixed(4)}
                </p>
              )}
            </div>

            {(editingFilament.backupRolls || []).length > 0 && (
              <div className="form-group">
                <label className="form-label">Backup Rolls ({editingFilament.backupRolls.length})</label>
                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                  {editingFilament.backupRolls.map((r, i) => (
                    <span key={r.id} style={{ marginRight: '8px' }}>
                      ${r.cost.toFixed(2)}{i < editingFilament.backupRolls.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                  Manage backup rolls from the main inventory view
                </p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Reorder Threshold (grams)</label>
              <input
                type="number"
                className="form-input"
                value={editingFilament.reorderAt ?? 250}
                onChange={e => setEditingFilament({ ...editingFilament, reorderAt: e.target.value })}
                min="0"
                placeholder="Alert when at or below this amount"
              />
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                Alert triggers when amount falls to {editingFilament.reorderAt ?? 250}g or below with 0 backup rolls
              </p>
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
function ModelsTab({ models, stores, printers, externalParts, saveModels, showNotification }) {
  const [showAddModel, setShowAddModel] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [newModel, setNewModel] = useState({
    name: '',
    variantName: '',
    defaultColor: '',
    externalParts: [],
    storeId: '',
    imageUrl: '',
    printerSettings: [],
    aliases: [],
    file3mfUrl: '',
    folder: 'Uncategorized',
    processingDays: 3,
    stockCount: null
  });
  const [newAlias, setNewAlias] = useState('');
  const [expandedModels, setExpandedModels] = useState({});
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');

  // Persist custom folders to localStorage
  const [customFolders, setCustomFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('modelFolders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save custom folders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('modelFolders', JSON.stringify(customFolders));
  }, [customFolders]);

  // Get unique folders: combine custom folders + folders from models, always include 'Uncategorized'
  const modelFolders = models.map(m => m.folder).filter(f => f && f !== 'Uncategorized');
  const allFolders = ['Uncategorized', ...new Set([...customFolders, ...modelFolders])].sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  // Group models by folder
  const groupedModels = models.reduce((acc, model) => {
    const folder = model.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(model);
    return acc;
  }, {});

  // Sort all folders (including empty ones)
  const sortedFolders = allFolders;

  const toggleModelExpanded = (modelId) => {
    setExpandedModels(prev => ({ ...prev, [modelId]: !prev[modelId] }));
  };

  const toggleFolderCollapsed = (folder) => {
    setCollapsedFolders(prev => ({ ...prev, [folder]: !(prev[folder] ?? true) }));
  };

  // Helper to check if folder is collapsed (default to true)
  const isFolderCollapsed = (folder) => collapsedFolders[folder] ?? true;

  const expandAllInFolder = (folder) => {
    const folderModels = groupedModels[folder] || [];
    const newExpanded = { ...expandedModels };
    folderModels.forEach(m => { newExpanded[m.id] = true; });
    setExpandedModels(newExpanded);
  };

  const collapseAllInFolder = (folder) => {
    const folderModels = groupedModels[folder] || [];
    const newExpanded = { ...expandedModels };
    folderModels.forEach(m => { newExpanded[m.id] = false; });
    setExpandedModels(newExpanded);
  };

  const [folderJustCreated, setFolderJustCreated] = useState(false);

  const createFolder = () => {
    try {
      if (!newFolderName.trim()) {
        setShowFolderInput(false);
        return;
      }
      const folderName = newFolderName.trim();
      if (allFolders.includes(folderName)) {
        showNotification('Folder already exists', 'error');
        setShowFolderInput(false);
        setNewFolderName('');
        return;
      }
      // Add to custom folders list (persisted to localStorage)
      setCustomFolders(prev => [...prev, folderName]);
      setNewFolderName('');
      setShowFolderInput(false);
      setFolderJustCreated(true);
      setTimeout(() => setFolderJustCreated(false), 300);
      showNotification(`Folder "${folderName}" created`);
    } catch (err) {
      console.error('Error creating folder:', err);
      setShowFolderInput(false);
      setNewFolderName('');
    }
  };

  const renameFolder = (oldName, newName) => {
    if (!newName.trim() || oldName === 'Uncategorized') return;
    const trimmedNew = newName.trim();
    if (allFolders.includes(trimmedNew) && trimmedNew !== oldName) {
      showNotification('Folder name already exists', 'error');
      return;
    }
    // Update custom folders list
    setCustomFolders(prev => prev.map(f => f === oldName ? trimmedNew : f));
    // Update all models in this folder
    const updated = models.map(m =>
      m.folder === oldName ? { ...m, folder: trimmedNew } : m
    );
    saveModels(updated);
    setRenamingFolder(null);
    showNotification(`Folder renamed to "${trimmedNew}"`);
  };

  const deleteFolder = (folderName) => {
    if (folderName === 'Uncategorized') return;
    // Remove from custom folders list
    setCustomFolders(prev => prev.filter(f => f !== folderName));
    // Move all models in this folder to Uncategorized
    const updated = models.map(m =>
      m.folder === folderName ? { ...m, folder: 'Uncategorized' } : m
    );
    saveModels(updated);
    showNotification(`Folder "${folderName}" deleted. Models moved to Uncategorized.`);
  };

  const moveModelToFolder = (modelId, newFolder) => {
    const updated = models.map(m =>
      m.id === modelId ? { ...m, folder: newFolder } : m
    );
    saveModels(updated);
  };

  // Initialize printer settings for a model (now with plates containing parts)
  const initPrinterSettings = () => {
    return printers.map(p => ({
      printerId: p.id,
      plates: [{ name: 'Plate 1', isMultiColor: false, parts: [] }]
    }));
  };

  // Add a plate to a printer setting
  const addPlate = (settings, printerId) => {
    return settings.map(s => {
      if (s.printerId === printerId) {
        const plateNum = (s.plates?.length || 0) + 1;
        return {
          ...s,
          plates: [...(s.plates || []), { name: `Plate ${plateNum}`, isMultiColor: false, parts: [] }]
        };
      }
      return s;
    });
  };

  // Remove a plate from a printer setting
  const removePlate = (settings, printerId, plateIdx) => {
    return settings.map(s => {
      if (s.printerId === printerId) {
        return {
          ...s,
          plates: s.plates.filter((_, i) => i !== plateIdx)
        };
      }
      return s;
    });
  };

  // Update a specific plate in a printer setting
  const updatePlate = (settings, printerId, plateIdx, field, value) => {
    return settings.map(s => {
      if (s.printerId === printerId) {
        return {
          ...s,
          plates: s.plates.map((plate, i) =>
            i === plateIdx ? { ...plate, [field]: value } : plate
          )
        };
      }
      return s;
    });
  };

  // Add a part to a plate
  const addPart = (settings, printerId, plateIdx) => {
    return settings.map(s => {
      if (s.printerId === printerId) {
        return {
          ...s,
          plates: s.plates.map((plate, i) => {
            if (i === plateIdx) {
              const partNum = (plate.parts?.length || 0) + 1;
              return {
                ...plate,
                parts: [...(plate.parts || []), { name: `Part ${partNum}`, filamentUsage: '', printHours: '0', printMinutes: '', quantity: 1, isMultiColor: false }]
              };
            }
            return plate;
          })
        };
      }
      return s;
    });
  };

  // Remove a part from a plate
  const removePart = (settings, printerId, plateIdx, partIdx) => {
    return settings.map(s => {
      if (s.printerId === printerId) {
        return {
          ...s,
          plates: s.plates.map((plate, i) => {
            if (i === plateIdx) {
              return {
                ...plate,
                parts: plate.parts.filter((_, pi) => pi !== partIdx)
              };
            }
            return plate;
          })
        };
      }
      return s;
    });
  };

  // Update a specific part in a plate
  const updatePart = (settings, printerId, plateIdx, partIdx, field, value) => {
    return settings.map(s => {
      if (s.printerId === printerId) {
        return {
          ...s,
          plates: s.plates.map((plate, i) => {
            if (i === plateIdx) {
              return {
                ...plate,
                parts: plate.parts.map((part, pi) =>
                  pi === partIdx ? { ...part, [field]: value } : part
                )
              };
            }
            return plate;
          })
        };
      }
      return s;
    });
  };

  // Calculate totals for a plate (sum of its parts, accounting for quantity)
  const calculatePlateTotals = (plate) => {
    if (!plate?.parts?.length) return { totalFilament: 0, totalMinutes: 0 };

    // Calculate filament from parts (always sum)
    const totalFilament = plate.parts.reduce((sum, part) => {
      const qty = parseInt(part.quantity) || 1;
      return sum + ((parseFloat(part.filamentUsage) || 0) * qty);
    }, 0);

    // Use actual plate time if set, otherwise sum from parts
    const hasActualTime = (plate.actualPrintHours && parseInt(plate.actualPrintHours) > 0) ||
                          (plate.actualPrintMinutes && parseInt(plate.actualPrintMinutes) > 0);

    let totalMinutes;
    if (hasActualTime) {
      totalMinutes = ((parseInt(plate.actualPrintHours) || 0) * 60) + (parseInt(plate.actualPrintMinutes) || 0);
    } else {
      totalMinutes = plate.parts.reduce((sum, part) => {
        const qty = parseInt(part.quantity) || 1;
        return sum + (((parseInt(part.printHours) || 0) * 60) + (parseInt(part.printMinutes) || 0)) * qty;
      }, 0);
    }

    return { totalFilament, totalMinutes };
  };

  // Calculate totals for a printer setting (sum of all plates)
  const calculatePrinterTotals = (printerSetting) => {
    if (!printerSetting?.plates?.length) return { totalFilament: 0, totalMinutes: 0 };
    return printerSetting.plates.reduce((acc, plate) => {
      const plateTotals = calculatePlateTotals(plate);
      return {
        totalFilament: acc.totalFilament + plateTotals.totalFilament,
        totalMinutes: acc.totalMinutes + plateTotals.totalMinutes
      };
    }, { totalFilament: 0, totalMinutes: 0 });
  };

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
    if (!newModel.name) {
      showNotification('Please enter model name', 'error');
      return;
    }

    // Convert printer settings to proper format with plates and parts
    console.log('newModel.printerSettings BEFORE transform:', JSON.stringify(newModel.printerSettings, null, 2));

    // Keep all plates and parts, just convert values to proper types
    const printerSettings = newModel.printerSettings.map(s => ({
      printerId: s.printerId,
      plates: (s.plates || []).map(plate => ({
        name: plate.name || 'Plate',
        isMultiColor: plate.isMultiColor || false,
        parts: (plate.parts || []).map(part => ({
          name: part.name || 'Part',
          filamentUsage: parseFloat(part.filamentUsage) || 0,
          printHours: parseInt(part.printHours) || 0,
          printMinutes: parseInt(part.printMinutes) || 0,
          quantity: parseInt(part.quantity) || 1,
          isMultiColor: part.isMultiColor || false
        }))
      }))
    }));

    console.log('Saving model with printerSettings:', JSON.stringify(printerSettings, null, 2));

    const model = {
      id: Date.now().toString(),
      name: newModel.name,
      variantName: newModel.variantName || '',
      defaultColor: newModel.defaultColor,
      externalParts: newModel.externalParts,
      storeId: newModel.storeId || null,
      imageUrl: newModel.imageUrl || '',
      printerSettings: printerSettings,
      aliases: newModel.aliases || [],
      file3mfUrl: newModel.file3mfUrl || '',
      folder: newModel.folder || 'Uncategorized',
      processingDays: newModel.processingDays || 3,
      stockCount: newModel.stockCount !== null && newModel.stockCount !== '' ? parseInt(newModel.stockCount) : null
    };

    saveModels([...models, model]);
    setNewModel({ name: '', variantName: '', defaultColor: '', externalParts: [], storeId: '', imageUrl: '', printerSettings: [], aliases: [], file3mfUrl: '', folder: 'Uncategorized', processingDays: 3, stockCount: null });
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ minWidth: '140px' }}>
            {showFolderInput ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); createFolder(); }
                    if (e.key === 'Escape') { setShowFolderInput(false); setNewFolderName(''); }
                  }}
                  autoFocus
                  style={{ width: '120px', padding: '6px 10px' }}
                />
                <button type="button" className="btn btn-primary btn-small" onClick={(e) => { e.preventDefault(); e.stopPropagation(); createFolder(); }}>
                  <Check size={14} />
                </button>
                <button type="button" className="btn btn-secondary btn-small" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowFolderInput(false); setNewFolderName(''); }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setShowFolderInput(true); }}>
                <Box size={18} /> New Folder
              </button>
            )}
          </div>
          <button type="button" className="btn btn-primary" onClick={(e) => { e.stopPropagation(); if (!folderJustCreated) setShowAddModel(true); }}>
            <Plus size={18} /> Add Model
          </button>
        </div>
      </div>

      {models.length === 0 ? (
        <div className="empty-state">
          <Printer />
          <p>No models added yet</p>
          <p style={{ fontSize: '0.85rem' }}>Add your 3D models to track filament usage and required parts</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedFolders.map(folder => (
            <div key={folder} style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.03) 0%, rgba(0,204,255,0.03) 100%)',
              border: '1px solid rgba(0,255,136,0.15)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {/* Folder Header */}
              <div
                onClick={() => !renamingFolder && toggleFolderCollapsed(folder)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0,255,136,0.08)',
                  cursor: renamingFolder === folder ? 'default' : 'pointer',
                  borderBottom: isFolderCollapsed(folder) ? 'none' : '1px solid rgba(0,255,136,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isFolderCollapsed(folder) ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  <Box size={18} style={{ color: '#00ff88' }} />
                  {renamingFolder === folder ? (
                    <input
                      type="text"
                      className="form-input"
                      value={renameFolderValue}
                      onChange={e => setRenameFolderValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') renameFolder(folder, renameFolderValue);
                        if (e.key === 'Escape') setRenamingFolder(null);
                      }}
                      onBlur={() => renameFolder(folder, renameFolderValue)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                      style={{ width: '150px', padding: '4px 8px', fontSize: '0.9rem' }}
                    />
                  ) : (
                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>
                      {folder}
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#888',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {(groupedModels[folder] || []).length} model{(groupedModels[folder] || []).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => expandAllInFolder(folder)}
                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                  >
                    Expand All
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => collapseAllInFolder(folder)}
                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                  >
                    Collapse All
                  </button>
                  {folder !== 'Uncategorized' && (
                    <>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => { setRenamingFolder(folder); setRenameFolderValue(folder); }}
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        title="Rename folder"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => deleteFolder(folder)}
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        title="Delete folder (moves models to Uncategorized)"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Folder Contents */}
              {!isFolderCollapsed(folder) && (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(groupedModels[folder] || []).map(model => {
                    const isExpanded = expandedModels[model.id];
                    return (
                      <div key={model.id} className="model-card" style={{ margin: 0 }}>
                        {/* Collapsed Header - Always Visible */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleModelExpanded(model.id)}
                        >
                          {isExpanded ? <ChevronDown size={16} style={{ color: '#00ff88' }} /> : <ChevronRight size={16} style={{ color: '#888' }} />}

                          {/* Model Image Thumbnail */}
                          {model.imageUrl && (
                            <img
                              src={model.imageUrl}
                              alt={model.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                            />
                          )}

                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                              {model.name}
                              {model.variantName && (
                                <span style={{ color: '#00ccff', fontWeight: 'normal', marginLeft: '8px' }}>
                                  — {model.variantName}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', gap: '12px', marginTop: '2px' }}>
                              {model.defaultColor && <span>Color: {model.defaultColor}</span>}
                              {model.printerSettings?.[0] && (() => {
                                const totals = calculatePrinterTotals(model.printerSettings[0]);
                                return <span>{totals.totalFilament.toFixed(2)}g • {Math.floor(totals.totalMinutes / 60)}h {totals.totalMinutes % 60}m</span>;
                              })()}
                              {model.externalParts?.length > 0 && <span>{model.externalParts.length} part{model.externalParts.length !== 1 ? 's' : ''}</span>}
                              {model.stockCount !== null && model.stockCount !== undefined && (
                                <span style={{
                                  color: model.stockCount <= 3 ? '#ff6b6b' : model.stockCount <= 10 ? '#ffc107' : '#00ff88',
                                  fontWeight: model.stockCount <= 3 ? '600' : 'normal'
                                }}>
                                  Stock: {model.stockCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {model.storeId && (
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              backgroundColor: getStoreColor(model.storeId) + '20',
                              color: getStoreColor(model.storeId),
                              border: `1px solid ${getStoreColor(model.storeId)}40`
                            }}>
                              {getStoreName(model.storeId)}
                            </span>
                          )}

                          {/* Quick Actions */}
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                            <select
                              className="form-input"
                              value={model.folder || 'Uncategorized'}
                              onChange={e => moveModelToFolder(model.id, e.target.value)}
                              style={{ padding: '4px 6px', fontSize: '0.7rem', width: '110px' }}
                              title="Move to folder"
                            >
                              {allFolders.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                            <button className="btn btn-secondary btn-small" onClick={() => setEditingModel(model)} style={{ padding: '4px 8px' }}>
                              <Edit2 size={12} />
                            </button>
                            <button className="btn btn-secondary btn-small" onClick={() => duplicateModel(model)} title="Create variant" style={{ padding: '4px 8px' }}>
                              <Plus size={12} />
                            </button>
                            <button className="btn btn-danger btn-small" onClick={() => deleteModel(model.id)} style={{ padding: '4px 8px' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
                                {model.file3mfUrl && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <button
                                      className="btn btn-primary btn-small"
                                      title={model.file3mfUrl.startsWith('http') ? 'Open file' : 'Copy path to clipboard'}
                                      onClick={() => {
                                        if (model.file3mfUrl.startsWith('http')) {
                                          window.open(model.file3mfUrl, '_blank');
                                        } else {
                                          navigator.clipboard.writeText(model.file3mfUrl);
                                          showNotification('Path copied! Use ⌘+Shift+G in Finder to open');
                                        }
                                      }}
                                    >
                                      <Printer size={14} /> {model.file3mfUrl.startsWith('http') ? 'Open 3MF' : 'Copy Path'}
                                    </button>
                                  </div>
                                )}

                                {/* Printer Settings with Plates */}
                                {model.printerSettings?.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Printer Settings:</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {model.printerSettings.map(setting => {
                                        const printer = printers.find(p => p.id === setting.printerId);
                                        const totals = calculatePrinterTotals(setting);
                                        return printer ? (
                                          <div key={setting.printerId} style={{
                                            background: 'rgba(0,255,136,0.1)',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem'
                                          }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                              <div style={{ fontWeight: '500', color: '#00ff88' }}>{printer.name}</div>
                                              <div style={{ color: '#00ccff', fontSize: '0.8rem' }}>
                                                Total: {totals.totalFilament.toFixed(2)}g • {Math.floor(totals.totalMinutes / 60)}h {totals.totalMinutes % 60}m
                                              </div>
                                            </div>
                                            {setting.plates?.length > 0 && (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {setting.plates.map((plate, idx) => {
                                                  const plateTotals = calculatePlateTotals(plate);
                                                  return (
                                                    <div key={idx} style={{
                                                      background: plate.isMultiColor ? 'rgba(165, 94, 234, 0.15)' : 'rgba(0,0,0,0.2)',
                                                      padding: '8px 10px',
                                                      borderRadius: '6px',
                                                      border: plate.isMultiColor ? '1px solid rgba(165, 94, 234, 0.3)' : 'none'
                                                    }}>
                                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: (plate.parts?.length || 0) > 0 ? '6px' : 0 }}>
                                                        {plate.isMultiColor && <Palette size={12} style={{ color: '#a55eea' }} />}
                                                        <span style={{ fontWeight: '500', color: plate.isMultiColor ? '#a55eea' : '#ccc', fontSize: '0.8rem' }}>
                                                          {plate.name}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: 'auto' }}>
                                                          {plateTotals.totalFilament.toFixed(2)}g • {Math.floor(plateTotals.totalMinutes / 60)}h {plateTotals.totalMinutes % 60}m
                                                        </span>
                                                      </div>
                                                      {(plate.parts?.length || 0) > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginLeft: '18px' }}>
                                                          {plate.parts.map((part, partIdx) => (
                                                            <span key={partIdx} style={{
                                                              background: 'rgba(0, 204, 255, 0.1)',
                                                              border: '1px solid rgba(0, 204, 255, 0.2)',
                                                              padding: '2px 6px',
                                                              borderRadius: '3px',
                                                              fontSize: '0.65rem',
                                                              color: '#00ccff'
                                                            }}>
                                                              {part.name}{(part.quantity || 1) > 1 ? ` ×${part.quantity}` : ''} ({part.filamentUsage}g)
                                                            </span>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {model.externalParts?.length > 0 && (
                              <div style={{ marginTop: '12px' }}>
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

                            {model.aliases?.length > 0 && (
                              <div style={{ marginTop: '12px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Aliases:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {model.aliases.map((alias, idx) => (
                                    <span key={idx} style={{
                                      background: 'rgba(255,159,67,0.1)',
                                      border: '1px solid rgba(255,159,67,0.3)',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      color: '#ff9f43'
                                    }}>
                                      {alias}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
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
                value={newModel.variantName || ''}
                onChange={e => setNewModel({ ...newModel, variantName: e.target.value })}
                placeholder="e.g., Small, LED Plug-In, Rechargeable"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
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

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Folder</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select
                    className="form-input"
                    value={newModel.folder || 'Uncategorized'}
                    onChange={e => {
                      if (e.target.value === '__new__') {
                        const folderName = prompt('Enter new folder name:');
                        if (folderName && folderName.trim()) {
                          const trimmed = folderName.trim();
                          if (!allFolders.includes(trimmed)) {
                            setCustomFolders(prev => [...prev, trimmed]);
                          }
                          setNewModel({ ...newModel, folder: trimmed });
                        }
                      } else {
                        setNewModel({ ...newModel, folder: e.target.value });
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    {allFolders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                    <option value="__new__">+ Create New Folder</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Processing Time (days)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newModel.processingDays || 3}
                  onChange={e => setNewModel({ ...newModel, processingDays: parseInt(e.target.value) || 3 })}
                  min="1"
                  placeholder="3"
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Stock Count</label>
                <input
                  type="number"
                  className="form-input"
                  value={newModel.stockCount ?? ''}
                  onChange={e => setNewModel({ ...newModel, stockCount: e.target.value === '' ? null : parseInt(e.target.value) })}
                  min="0"
                  placeholder="Optional"
                />
                <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>Leave blank if not tracking</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Title Aliases</label>
              <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
                Add alternate Etsy listing titles that should match to this model
              </p>
              {(newModel.aliases || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {newModel.aliases.map((alias, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(0, 204, 255, 0.15)',
                      border: '1px solid rgba(0, 204, 255, 0.3)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {alias}
                      <button
                        type="button"
                        onClick={() => setNewModel({
                          ...newModel,
                          aliases: newModel.aliases.filter((_, i) => i !== idx)
                        })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newAlias}
                  onChange={e => setNewAlias(e.target.value)}
                  placeholder="e.g., Modern Minimalist Incense Holder"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newAlias.trim()) {
                      e.preventDefault();
                      setNewModel({
                        ...newModel,
                        aliases: [...(newModel.aliases || []), newAlias.trim()]
                      });
                      setNewAlias('');
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (newAlias.trim()) {
                      setNewModel({
                        ...newModel,
                        aliases: [...(newModel.aliases || []), newAlias.trim()]
                      });
                      setNewAlias('');
                    }
                  }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
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

            <div className="form-group">
              <label className="form-label">3MF File Path</label>
              <input
                type="text"
                className="form-input"
                value={newModel.file3mfUrl}
                onChange={e => setNewModel({ ...newModel, file3mfUrl: e.target.value })}
                placeholder="/Users/you/3DPrinting/Model.3mf"
              />
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '6px' }}>
                Local file path or server URL
              </p>
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

            {/* Printer Settings with Plates */}
            <div className="form-group">
              <label className="form-label">Printer Settings & Plates</label>
              <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '12px' }}>
                Add plates for each printer with their filament usage and print time
              </p>
              {printers.map(printer => {
                const setting = newModel.printerSettings.find(s => s.printerId === printer.id) || {
                  printerId: printer.id, plates: []
                };
                const totals = calculatePrinterTotals(setting);
                return (
                  <div key={printer.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '500', color: '#00ff88' }}>{printer.name}</div>
                      {setting.plates?.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          Total: {totals.totalFilament.toFixed(2)}g | {Math.floor(totals.totalMinutes / 60)}h {totals.totalMinutes % 60}m
                        </div>
                      )}
                    </div>

                    {/* Plates list with parts */}
                    {(setting.plates || []).map((plate, plateIdx) => {
                      const plateTotals = calculatePlateTotals(plate);
                      return (
                        <div key={plateIdx} style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '12px',
                          borderRadius: '6px',
                          marginBottom: '10px',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          {/* Plate header */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              className="form-input"
                              value={plate.name || ''}
                              onChange={e => {
                                const updated = updatePlate(newModel.printerSettings, printer.id, plateIdx, 'name', e.target.value);
                                setNewModel({ ...newModel, printerSettings: updated });
                              }}
                              placeholder="Plate name"
                              style={{ width: '140px', fontWeight: '500' }}
                            />
                            {/* Actual plate print time */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              background: 'rgba(0, 204, 255, 0.1)',
                              border: '1px solid rgba(0, 204, 255, 0.2)',
                              borderRadius: '6px'
                            }}>
                              <Clock size={12} style={{ color: '#00ccff' }} />
                              <span style={{ fontSize: '0.7rem', color: '#888' }}>Plate time:</span>
                              <input
                                type="number"
                                className="form-input"
                                value={plate.actualPrintHours || ''}
                                onChange={e => {
                                  const updated = updatePlate(newModel.printerSettings, printer.id, plateIdx, 'actualPrintHours', e.target.value);
                                  setNewModel({ ...newModel, printerSettings: updated });
                                }}
                                placeholder="0"
                                min="0"
                                style={{ width: '45px', padding: '4px 6px', fontSize: '0.85rem', textAlign: 'center' }}
                              />
                              <span style={{ color: '#888', fontSize: '0.75rem' }}>h</span>
                              <input
                                type="number"
                                className="form-input"
                                value={plate.actualPrintMinutes || ''}
                                onChange={e => {
                                  const updated = updatePlate(newModel.printerSettings, printer.id, plateIdx, 'actualPrintMinutes', e.target.value);
                                  setNewModel({ ...newModel, printerSettings: updated });
                                }}
                                placeholder="0"
                                min="0"
                                max="59"
                                style={{ width: '45px', padding: '4px 6px', fontSize: '0.85rem', textAlign: 'center' }}
                              />
                              <span style={{ color: '#888', fontSize: '0.75rem' }}>m</span>
                            </div>
                            {/* Plate totals */}
                            {(plate.parts?.length || 0) > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#00ccff', marginLeft: 'auto' }}>
                                {plateTotals.totalFilament.toFixed(2)}g • {Math.floor(plateTotals.totalMinutes / 60)}h {plateTotals.totalMinutes % 60}m
                              </span>
                            )}
                            <button
                              className="qty-btn"
                              onClick={() => {
                                const updated = removePlate(newModel.printerSettings, printer.id, plateIdx);
                                setNewModel({ ...newModel, printerSettings: updated });
                              }}
                              title="Remove plate"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Parts list */}
                          <div style={{ marginLeft: '12px', borderLeft: '2px solid rgba(0, 204, 255, 0.3)', paddingLeft: '12px' }}>
                            {(plate.parts || []).length === 0 && (
                              <p style={{ fontSize: '0.75rem', color: '#666', margin: '8px 0' }}>No parts added yet</p>
                            )}
                            {(plate.parts || []).map((part, partIdx) => (
                              <div key={partIdx} style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                marginBottom: '8px',
                                flexWrap: 'wrap',
                                background: part.isMultiColor ? 'rgba(165, 94, 234, 0.1)' : 'transparent',
                                padding: part.isMultiColor ? '6px 8px' : '0',
                                borderRadius: '6px',
                                border: part.isMultiColor ? '1px solid rgba(165, 94, 234, 0.2)' : 'none'
                              }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={part.name || ''}
                                  onChange={e => {
                                    const updated = updatePart(newModel.printerSettings, printer.id, plateIdx, partIdx, 'name', e.target.value);
                                    setNewModel({ ...newModel, printerSettings: updated });
                                  }}
                                  placeholder="Part name"
                                  style={{ width: '110px', fontSize: '1rem', padding: '8px 10px' }}
                                />
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>×</span>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={part.quantity || 1}
                                  onChange={e => {
                                    const updated = updatePart(newModel.printerSettings, printer.id, plateIdx, partIdx, 'quantity', e.target.value);
                                    setNewModel({ ...newModel, printerSettings: updated });
                                  }}
                                  placeholder="1"
                                  min="1"
                                  style={{ width: '45px', fontSize: '1rem', padding: '8px 6px', textAlign: 'center' }}
                                />
                                <input
                                  type="number"
                                  className="form-input"
                                  value={part.filamentUsage || ''}
                                  onChange={e => {
                                    const updated = updatePart(newModel.printerSettings, printer.id, plateIdx, partIdx, 'filamentUsage', e.target.value);
                                    setNewModel({ ...newModel, printerSettings: updated });
                                  }}
                                  placeholder="0"
                                  style={{ width: '60px', fontSize: '1rem', padding: '8px 10px' }}
                                />
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>g</span>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={part.printHours || ''}
                                  onChange={e => {
                                    const updated = updatePart(newModel.printerSettings, printer.id, plateIdx, partIdx, 'printHours', e.target.value);
                                    setNewModel({ ...newModel, printerSettings: updated });
                                  }}
                                  placeholder="0"
                                  min="0"
                                  style={{ width: '60px', fontSize: '1rem', padding: '8px 10px' }}
                                />
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>h</span>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={part.printMinutes || ''}
                                  onChange={e => {
                                    const updated = updatePart(newModel.printerSettings, printer.id, plateIdx, partIdx, 'printMinutes', e.target.value);
                                    setNewModel({ ...newModel, printerSettings: updated });
                                  }}
                                  placeholder="0"
                                  min="0"
                                  max="59"
                                  style={{ width: '60px', fontSize: '1rem', padding: '8px 10px' }}
                                />
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>m</span>
                                <label style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: part.isMultiColor ? 'rgba(165, 94, 234, 0.3)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${part.isMultiColor ? 'rgba(165, 94, 234, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                                  fontSize: '0.7rem',
                                  color: part.isMultiColor ? '#a55eea' : '#888'
                                }} title="When enabled, you'll choose the color when completing this part">
                                  <input
                                    type="checkbox"
                                    checked={part.isMultiColor || false}
                                    onChange={e => {
                                      const updated = updatePart(newModel.printerSettings, printer.id, plateIdx, partIdx, 'isMultiColor', e.target.checked);
                                      setNewModel({ ...newModel, printerSettings: updated });
                                    }}
                                    style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                                  />
                                  Multi
                                </label>
                                <button
                                  className="qty-btn"
                                  onClick={() => {
                                    const updated = removePart(newModel.printerSettings, printer.id, plateIdx, partIdx);
                                    setNewModel({ ...newModel, printerSettings: updated });
                                  }}
                                  title="Remove part"
                                  style={{ padding: '4px', marginLeft: '4px' }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => {
                                const updated = addPart(newModel.printerSettings, printer.id, plateIdx);
                                setNewModel({ ...newModel, printerSettings: updated });
                              }}
                              style={{ marginTop: '4px', padding: '4px 8px', fontSize: '0.7rem' }}
                            >
                              <Plus size={12} /> Add Part
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        const existing = newModel.printerSettings.find(s => s.printerId === printer.id);
                        let updated;
                        if (existing) {
                          updated = addPlate(newModel.printerSettings, printer.id);
                        } else {
                          updated = [...newModel.printerSettings, {
                            printerId: printer.id,
                            plates: [{ name: 'Plate 1', isMultiColor: false, parts: [] }]
                          }];
                        }
                        setNewModel({ ...newModel, printerSettings: updated });
                      }}
                    >
                      <Plus size={14} /> Add Plate
                    </button>
                  </div>
                );
              })}
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
                placeholder="e.g., Small, LED Plug-In, Rechargeable"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
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

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Folder</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select
                    className="form-input"
                    value={editingModel.folder || 'Uncategorized'}
                    onChange={e => {
                      if (e.target.value === '__new__') {
                        const folderName = prompt('Enter new folder name:');
                        if (folderName && folderName.trim()) {
                          const trimmed = folderName.trim();
                          if (!allFolders.includes(trimmed)) {
                            setCustomFolders(prev => [...prev, trimmed]);
                          }
                          setEditingModel({ ...editingModel, folder: trimmed });
                        }
                      } else {
                        setEditingModel({ ...editingModel, folder: e.target.value });
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    {allFolders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                    <option value="__new__">+ Create New Folder</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Processing Time (days)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingModel.processingDays || 3}
                  onChange={e => setEditingModel({ ...editingModel, processingDays: parseInt(e.target.value) || 3 })}
                  min="1"
                  placeholder="3"
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Stock Count</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingModel.stockCount ?? ''}
                  onChange={e => setEditingModel({ ...editingModel, stockCount: e.target.value === '' ? null : parseInt(e.target.value) })}
                  min="0"
                  placeholder="Optional"
                />
                <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>Leave blank if not tracking</p>
              </div>
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

            <div className="form-group">
              <label className="form-label">3MF File Path</label>
              <input
                type="text"
                className="form-input"
                value={editingModel.file3mfUrl || ''}
                onChange={e => setEditingModel({ ...editingModel, file3mfUrl: e.target.value })}
                placeholder="/Users/you/3DPrinting/Model.3mf"
              />
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '6px' }}>
                Local file path or server URL
              </p>
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

            <div className="form-group">
              <label className="form-label">Product Title Aliases</label>
              <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
                Add alternate Etsy listing titles that should match to this model
              </p>
              {(editingModel.aliases || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {editingModel.aliases.map((alias, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(0, 204, 255, 0.15)',
                      border: '1px solid rgba(0, 204, 255, 0.3)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {alias}
                      <button
                        type="button"
                        onClick={() => setEditingModel({
                          ...editingModel,
                          aliases: editingModel.aliases.filter((_, i) => i !== idx)
                        })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newAlias}
                  onChange={e => setNewAlias(e.target.value)}
                  placeholder="e.g., Modern Minimalist Incense Holder"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newAlias.trim()) {
                      e.preventDefault();
                      setEditingModel({
                        ...editingModel,
                        aliases: [...(editingModel.aliases || []), newAlias.trim()]
                      });
                      setNewAlias('');
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (newAlias.trim()) {
                      setEditingModel({
                        ...editingModel,
                        aliases: [...(editingModel.aliases || []), newAlias.trim()]
                      });
                      setNewAlias('');
                    }
                  }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>

            {/* Printer Settings with Plates */}
            <div className="form-group">
              <label className="form-label">Printer Settings & Plates</label>
              <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '12px' }}>
                Add plates for each printer with their filament usage and print time
              </p>
              {printers.map(printer => {
                const setting = (editingModel.printerSettings || []).find(s => s.printerId === printer.id) || {
                  printerId: printer.id, plates: []
                };
                const totals = calculatePrinterTotals(setting);
                return (
                  <div key={printer.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '500', color: '#00ff88' }}>{printer.name}</div>
                      {setting.plates?.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          Total: {totals.totalFilament.toFixed(2)}g | {Math.floor(totals.totalMinutes / 60)}h {totals.totalMinutes % 60}m
                        </div>
                      )}
                    </div>

                    {/* Plates list with parts */}
                    {(setting.plates || []).map((plate, plateIdx) => {
                      const plateTotals = calculatePlateTotals(plate);
                      return (
                        <div key={plateIdx} style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '12px',
                          borderRadius: '6px',
                          marginBottom: '10px',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          {/* Plate header */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              className="form-input"
                              value={plate.name || ''}
                              onChange={e => {
                                const updated = updatePlate(editingModel.printerSettings || [], printer.id, plateIdx, 'name', e.target.value);
                                setEditingModel({ ...editingModel, printerSettings: updated });
                              }}
                              placeholder="Plate name"
                              style={{ width: '140px', fontWeight: '500' }}
                            />
                            {/* Actual plate print time */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              background: 'rgba(0, 204, 255, 0.1)',
                              border: '1px solid rgba(0, 204, 255, 0.2)',
                              borderRadius: '6px'
                            }}>
                              <Clock size={12} style={{ color: '#00ccff' }} />
                              <span style={{ fontSize: '0.7rem', color: '#888' }}>Plate time:</span>
                              <input
                                type="number"
                                className="form-input"
                                value={plate.actualPrintHours || ''}
                                onChange={e => {
                                  const updated = updatePlate(editingModel.printerSettings || [], printer.id, plateIdx, 'actualPrintHours', e.target.value);
                                  setEditingModel({ ...editingModel, printerSettings: updated });
                                }}
                                placeholder="0"
                                min="0"
                                style={{ width: '45px', padding: '4px 6px', fontSize: '0.85rem', textAlign: 'center' }}
                              />
                              <span style={{ color: '#888', fontSize: '0.75rem' }}>h</span>
                              <input
                                type="number"
                                className="form-input"
                                value={plate.actualPrintMinutes || ''}
                                onChange={e => {
                                  const updated = updatePlate(editingModel.printerSettings || [], printer.id, plateIdx, 'actualPrintMinutes', e.target.value);
                                  setEditingModel({ ...editingModel, printerSettings: updated });
                                }}
                                placeholder="0"
                                min="0"
                                max="59"
                                style={{ width: '45px', padding: '4px 6px', fontSize: '0.85rem', textAlign: 'center' }}
                              />
                              <span style={{ color: '#888', fontSize: '0.75rem' }}>m</span>
                            </div>
                            {/* Plate totals */}
                            {(plate.parts?.length || 0) > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#00ccff', marginLeft: 'auto' }}>
                                {plateTotals.totalFilament.toFixed(2)}g • {Math.floor(plateTotals.totalMinutes / 60)}h {plateTotals.totalMinutes % 60}m
                              </span>
                            )}
                            <button
                              className="qty-btn"
                              onClick={() => {
                                const updated = removePlate(editingModel.printerSettings || [], printer.id, plateIdx);
                                setEditingModel({ ...editingModel, printerSettings: updated });
                              }}
                              title="Remove plate"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Parts list */}
                          <div style={{ marginLeft: '12px', borderLeft: '2px solid rgba(0, 204, 255, 0.3)', paddingLeft: '12px' }}>
                            {(plate.parts || []).length === 0 && (
                              <p style={{ fontSize: '0.75rem', color: '#666', margin: '8px 0' }}>No parts added yet</p>
                            )}
                            {(plate.parts || []).map((part, partIdx) => (
                              <div key={partIdx} style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                marginBottom: '8px',
                                flexWrap: 'wrap',
                                background: part.isMultiColor ? 'rgba(165, 94, 234, 0.1)' : 'transparent',
                                padding: part.isMultiColor ? '6px 8px' : '0',
                                borderRadius: '6px',
                                border: part.isMultiColor ? '1px solid rgba(165, 94, 234, 0.2)' : 'none'
                              }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={part.name || ''}
                                  onChange={e => {
                                    const updated = updatePart(editingModel.printerSettings || [], printer.id, plateIdx, partIdx, 'name', e.target.value);
                                    setEditingModel({ ...editingModel, printerSettings: updated });
                                  }}
                                  placeholder="Part name"
                                  style={{ width: '110px', fontSize: '1rem', padding: '8px 10px' }}
                                />
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>×</span>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={part.quantity || 1}
                                  onChange={e => {
                                    const updated = updatePart(editingModel.printerSettings || [], printer.id, plateIdx, partIdx, 'quantity', e.target.value);
                                    setEditingModel({ ...editingModel, printerSettings: updated });
                                  }}
                                  placeholder="1"
                                  min="1"
                                  style={{ width: '45px', fontSize: '1rem', padding: '8px 6px', textAlign: 'center' }}
                                />
                                <input
                                  type="number"
                                  className="form-input"
                                  value={part.filamentUsage || ''}
                                  onChange={e => {
                                    const updated = updatePart(editingModel.printerSettings || [], printer.id, plateIdx, partIdx, 'filamentUsage', e.target.value);
                                    setEditingModel({ ...editingModel, printerSettings: updated });
                                  }}
                                  placeholder="0"
                                  style={{ width: '60px', fontSize: '1rem', padding: '8px 10px' }}
                                />
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>g</span>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={part.printHours || ''}
                                  onChange={e => {
                                    const updated = updatePart(editingModel.printerSettings || [], printer.id, plateIdx, partIdx, 'printHours', e.target.value);
                                    setEditingModel({ ...editingModel, printerSettings: updated });
                                  }}
                                  placeholder="0"
                                  min="0"
                                  style={{ width: '50px', fontSize: '1rem', padding: '8px 10px' }}
                                />
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>h</span>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={part.printMinutes || ''}
                                  onChange={e => {
                                    const updated = updatePart(editingModel.printerSettings || [], printer.id, plateIdx, partIdx, 'printMinutes', e.target.value);
                                    setEditingModel({ ...editingModel, printerSettings: updated });
                                  }}
                                  placeholder="0"
                                  min="0"
                                  max="59"
                                  style={{ width: '60px', fontSize: '1rem', padding: '8px 10px' }}
                                />
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>m</span>
                                <label style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: part.isMultiColor ? 'rgba(165, 94, 234, 0.3)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${part.isMultiColor ? 'rgba(165, 94, 234, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                                  fontSize: '0.7rem',
                                  color: part.isMultiColor ? '#a55eea' : '#888'
                                }} title="When enabled, you'll choose the color when completing this part">
                                  <input
                                    type="checkbox"
                                    checked={part.isMultiColor || false}
                                    onChange={e => {
                                      const updated = updatePart(editingModel.printerSettings || [], printer.id, plateIdx, partIdx, 'isMultiColor', e.target.checked);
                                      setEditingModel({ ...editingModel, printerSettings: updated });
                                    }}
                                    style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                                  />
                                  Multi
                                </label>
                                <button
                                  className="qty-btn"
                                  onClick={() => {
                                    const updated = removePart(editingModel.printerSettings || [], printer.id, plateIdx, partIdx);
                                    setEditingModel({ ...editingModel, printerSettings: updated });
                                  }}
                                  title="Remove part"
                                  style={{ padding: '4px', marginLeft: '4px' }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => {
                                const updated = addPart(editingModel.printerSettings || [], printer.id, plateIdx);
                                setEditingModel({ ...editingModel, printerSettings: updated });
                              }}
                              style={{ marginTop: '4px', padding: '4px 8px', fontSize: '0.7rem' }}
                            >
                              <Plus size={12} /> Add Part
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        const existing = (editingModel.printerSettings || []).find(s => s.printerId === printer.id);
                        let updated;
                        if (existing) {
                          updated = addPlate(editingModel.printerSettings || [], printer.id);
                        } else {
                          updated = [...(editingModel.printerSettings || []), {
                            printerId: printer.id,
                            plates: [{ name: 'Plate 1', isMultiColor: false, parts: [] }]
                          }];
                        }
                        setEditingModel({ ...editingModel, printerSettings: updated });
                      }}
                    >
                      <Plus size={14} /> Add Plate
                    </button>
                  </div>
                );
              })}
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
  const [newPart, setNewPart] = useState({ name: '', quantity: '', categoryId: '', reorderAt: '', costPerUnit: '' });
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
      // Update costPerUnit if provided
      if (newPart.costPerUnit) {
        memberParts[existing].costPerUnit = parseFloat(newPart.costPerUnit);
      }
    } else {
      memberParts.push({
        id: Date.now().toString(),
        name: newPart.name,
        quantity: parseInt(newPart.quantity),
        categoryId: newPart.categoryId || null,
        reorderAt: newPart.reorderAt ? parseInt(newPart.reorderAt) : null,
        costPerUnit: newPart.costPerUnit ? parseFloat(newPart.costPerUnit) : 0
      });
    }

    saveExternalParts({ ...externalParts, [memberId]: memberParts });
    setNewPart({ name: '', quantity: '', categoryId: newPart.categoryId, reorderAt: '', costPerUnit: '' });
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
                            {part.costPerUnit > 0 && (
                              <span style={{ color: '#00ff88', marginLeft: '8px' }}>
                                ${part.costPerUnit.toFixed(2)}/unit
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
                <input
                  type="number"
                  className="add-item-input"
                  placeholder="Cost/unit ($)"
                  title="Cost per unit for profit calculation"
                  value={newPart.costPerUnit}
                  onChange={e => setNewPart({ ...newPart, costPerUnit: e.target.value })}
                  style={{ flex: 1 }}
                  min="0"
                  step="0.01"
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

  // Collect all filaments that need restocking (at or below custom threshold and 0 rolls)
  const restockFilaments = [];
  teamMembers.forEach(member => {
    const memberFilaments = filaments[member.id] || [];
    memberFilaments.forEach(fil => {
      const threshold = fil.reorderAt ?? 250;
      if (fil.amount <= threshold && (fil.backupRolls?.length || 0) === 0) {
        restockFilaments.push({
          ...fil,
          type: 'filament',
          memberId: member.id,
          memberName: member.name,
          threshold: threshold
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
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span style={{ color: '#ffc107' }}>Reorder at {fil.threshold}g</span>
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

// Costs Tab Component
function CostsTab({ purchases, savePurchases, subscriptions, saveSubscriptions, printers, showNotification }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    name: '',
    category: 'filament',
    totalCost: '',
    quantity: '1',
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);

  // Subscription state
  const [showSubForm, setShowSubForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    price: '',
    frequency: 'monthly',
    url: '',
    notes: ''
  });

  const frequencies = [
    { id: 'daily', name: 'Daily', toYearly: 365 },
    { id: 'weekly', name: 'Weekly', toYearly: 52 },
    { id: 'monthly', name: 'Monthly', toYearly: 12 },
    { id: 'quarterly', name: 'Quarterly', toYearly: 4 },
    { id: 'yearly', name: 'Yearly', toYearly: 1 }
  ];

  const startEditSubscription = (sub) => {
    setEditingSubscription(sub);
    setNewSubscription({
      name: sub.name,
      price: sub.price.toString(),
      frequency: sub.frequency,
      url: sub.url || '',
      notes: sub.notes || ''
    });
    setShowSubForm(true);
  };

  const saveSubscription = () => {
    if (!newSubscription.name || !newSubscription.price) {
      showNotification('Please fill in name and price', 'error');
      return;
    }

    if (editingSubscription) {
      // Update existing subscription
      const updated = subscriptions.map(s =>
        s.id === editingSubscription.id
          ? {
              ...s,
              name: newSubscription.name,
              price: parseFloat(newSubscription.price),
              frequency: newSubscription.frequency,
              url: newSubscription.url,
              notes: newSubscription.notes
            }
          : s
      );
      saveSubscriptions(updated);
      showNotification('Subscription updated');
    } else {
      // Add new subscription
      const subscription = {
        id: Date.now().toString(),
        name: newSubscription.name,
        price: parseFloat(newSubscription.price),
        frequency: newSubscription.frequency,
        url: newSubscription.url,
        notes: newSubscription.notes,
        createdAt: Date.now()
      };
      saveSubscriptions([...subscriptions, subscription]);
      showNotification('Subscription added');
    }

    setNewSubscription({ name: '', price: '', frequency: 'monthly', url: '', notes: '' });
    setEditingSubscription(null);
    setShowSubForm(false);
  };

  const closeSubForm = () => {
    setShowSubForm(false);
    setEditingSubscription(null);
    setNewSubscription({ name: '', price: '', frequency: 'monthly', url: '', notes: '' });
  };

  const deleteSubscription = (id) => {
    if (confirm('Delete this subscription?')) {
      saveSubscriptions(subscriptions.filter(s => s.id !== id));
      showNotification('Subscription deleted');
    }
  };

  // Calculate subscription costs in all time periods
  const yearlySubCost = subscriptions.reduce((sum, sub) => {
    const freq = frequencies.find(f => f.id === sub.frequency);
    return sum + (sub.price * (freq?.toYearly || 12));
  }, 0);

  const monthlySubCost = yearlySubCost / 12;
  const weeklySubCost = yearlySubCost / 52;
  const dailySubCost = yearlySubCost / 365;

  const categories = [
    { id: 'filament', name: 'Filament', color: '#00ff88' },
    { id: 'parts', name: 'External Parts', color: '#00ccff' },
    { id: 'packaging', name: 'Packaging', color: '#ff9f43' },
    { id: 'electronics', name: 'Electronics', color: '#a55eea' },
    { id: 'hardware', name: 'Hardware', color: '#ff6b6b' },
    { id: 'shipping', name: 'Shipping Supplies', color: '#ffc107' },
    { id: 'other', name: 'Other', color: '#888' }
  ];

  const getCategoryColor = (catId) => {
    return categories.find(c => c.id === catId)?.color || '#888';
  };

  const getCategoryName = (catId) => {
    return categories.find(c => c.id === catId)?.name || catId;
  };

  const addPurchase = () => {
    if (!newPurchase.name || !newPurchase.totalCost || !newPurchase.quantity) {
      showNotification('Please fill in name, total cost, and quantity', 'error');
      return;
    }

    const totalCost = parseFloat(newPurchase.totalCost);
    const quantity = parseInt(newPurchase.quantity);
    const unitCost = totalCost / quantity;

    const purchase = {
      id: Date.now().toString(),
      name: newPurchase.name,
      category: newPurchase.category,
      totalCost: totalCost,
      quantity: quantity,
      unitCost: unitCost,
      supplier: newPurchase.supplier,
      purchaseDate: new Date(newPurchase.purchaseDate).getTime(),
      notes: newPurchase.notes,
      createdAt: Date.now()
    };

    savePurchases([...purchases, purchase]);
    setNewPurchase({
      name: '',
      category: 'filament',
      totalCost: '',
      quantity: '1',
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAddForm(false);
    showNotification('Purchase added successfully');
  };

  const deletePurchase = (id) => {
    if (confirm('Delete this purchase record?')) {
      savePurchases(purchases.filter(p => p.id !== id));
      showNotification('Purchase deleted');
    }
  };

  // Calculate analytics
  const analytics = {
    totalSpent: purchases.reduce((sum, p) => sum + p.totalCost, 0),
    byCategory: categories.map(cat => ({
      ...cat,
      total: purchases.filter(p => p.category === cat.id).reduce((sum, p) => sum + p.totalCost, 0),
      count: purchases.filter(p => p.category === cat.id).length
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total),
    thisMonth: purchases.filter(p => {
      const purchaseDate = new Date(p.purchaseDate);
      const now = new Date();
      return purchaseDate.getMonth() === now.getMonth() && purchaseDate.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + p.totalCost, 0),
    lastMonth: purchases.filter(p => {
      const purchaseDate = new Date(p.purchaseDate);
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return purchaseDate.getMonth() === lastMonth.getMonth() && purchaseDate.getFullYear() === lastMonth.getFullYear();
    }).reduce((sum, p) => sum + p.totalCost, 0),
    avgUnitCosts: categories.map(cat => {
      const catPurchases = purchases.filter(p => p.category === cat.id);
      if (catPurchases.length === 0) return null;
      const avgUnit = catPurchases.reduce((sum, p) => sum + p.unitCost, 0) / catPurchases.length;
      return { ...cat, avgUnit };
    }).filter(c => c !== null)
  };

  // Sort purchases by date (newest first)
  const sortedPurchases = [...purchases].sort((a, b) => b.purchaseDate - a.purchaseDate);

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">
          <DollarSign size={28} /> Cost Tracking
        </h2>
      </div>

      {/* Subscriptions Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', margin: 0 }}>
            <RefreshCw size={20} style={{ color: '#a55eea' }} />
            Subscriptions
            <span style={{
              fontSize: '0.75rem',
              background: 'rgba(165, 94, 234, 0.2)',
              color: '#a55eea',
              padding: '4px 10px',
              borderRadius: '12px',
              marginLeft: '8px'
            }}>
              ${monthlySubCost.toFixed(2)}/mo
            </span>
          </h3>
          <button className="btn btn-primary" onClick={() => setShowSubForm(true)} style={{ padding: '8px 16px' }}>
            <Plus size={16} /> Add
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
            <RefreshCw size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ margin: 0 }}>No subscriptions tracked yet</p>
            <p style={{ fontSize: '0.85rem', margin: '8px 0 0 0' }}>Add subscriptions to track recurring costs</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {subscriptions.map(sub => {
              const freq = frequencies.find(f => f.id === sub.frequency);
              const yearlyAmount = sub.price * (freq?.multiplier || 12);
              return (
                <div key={sub.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: 'rgba(165, 94, 234, 0.08)',
                  borderRadius: '8px',
                  border: '1px solid rgba(165, 94, 234, 0.2)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#fff' }}>{sub.name}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        background: 'rgba(165, 94, 234, 0.3)',
                        color: '#a55eea',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'capitalize'
                      }}>
                        {sub.frequency}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {sub.url && (
                        <a
                          href={sub.url.startsWith('http') ? sub.url : `https://${sub.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#00ccff', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ExternalLink size={12} /> Manage
                        </a>
                      )}
                      {sub.notes && <span style={{ color: '#888' }}>{sub.notes}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#a55eea', fontFamily: 'JetBrains Mono, monospace' }}>
                        ${sub.price.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        ${yearlyAmount.toFixed(2)}/yr
                      </div>
                    </div>
                    <button
                      className="qty-btn"
                      onClick={() => startEditSubscription(sub)}
                      title="Edit subscription"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="qty-btn"
                      onClick={() => deleteSubscription(sub.id)}
                      style={{ color: '#ff6b6b' }}
                      title="Delete subscription"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Subscriptions Total */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '16px',
              background: 'rgba(165, 94, 234, 0.15)',
              borderRadius: '8px',
              marginTop: '8px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>Daily</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#a55eea', fontFamily: 'JetBrains Mono, monospace' }}>
                  ${dailySubCost.toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>Weekly</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#a55eea', fontFamily: 'JetBrains Mono, monospace' }}>
                  ${weeklySubCost.toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>Monthly</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#a55eea', fontFamily: 'JetBrains Mono, monospace' }}>
                  ${monthlySubCost.toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>Yearly</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#a55eea', fontFamily: 'JetBrains Mono, monospace' }}>
                  ${yearlySubCost.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printer Payments Section */}
      {(() => {
        const printersWithPayments = (printers || []).filter(p => p.monthlyPayment > 0 && !p.isPaidOff);
        const totalMonthlyPayments = printersWithPayments.reduce((sum, p) => sum + (p.monthlyPayment || 0), 0);
        const totalRemainingBalance = printersWithPayments.reduce((sum, p) => sum + (p.remainingBalance || 0), 0);
        const paidOffPrinters = (printers || []).filter(p => p.isPaidOff && p.totalPrice > 0);

        if (printersWithPayments.length === 0 && paidOffPrinters.length === 0) return null;

        return (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', margin: 0 }}>
                <Printer size={20} style={{ color: '#ff9f43' }} />
                Printer Payments
              </h3>
              {totalMonthlyPayments > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>Monthly Total</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ff9f43', fontFamily: 'JetBrains Mono, monospace' }}>
                    ${totalMonthlyPayments.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Active Payments */}
            {printersWithPayments.length > 0 && (
              <>
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Active Payments</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {printersWithPayments.map(printer => {
                    const progress = printer.totalPrice > 0
                      ? ((printer.totalPrice - printer.remainingBalance) / printer.totalPrice) * 100
                      : 0;
                    return (
                      <div
                        key={printer.id}
                        style={{
                          background: 'rgba(255, 159, 67, 0.1)',
                          border: '1px solid rgba(255, 159, 67, 0.2)',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Printer size={16} style={{ color: '#ff9f43' }} />
                            <span style={{ fontWeight: '600' }}>{printer.name}</span>
                          </div>
                          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#ff9f43', fontFamily: 'JetBrains Mono, monospace' }}>
                            ${printer.monthlyPayment.toFixed(2)}/mo
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.85rem' }}>
                          <span style={{ color: '#888' }}>
                            Total: ${(printer.totalPrice || 0).toFixed(2)}
                          </span>
                          <span style={{ color: '#ff6b6b' }}>
                            Remaining: ${(printer.remainingBalance || 0).toFixed(2)}
                          </span>
                        </div>
                        {printer.totalPrice > 0 && (
                          <div style={{
                            height: '6px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${progress}%`,
                              background: 'linear-gradient(90deg, #ff9f43 0%, #00ff88 100%)',
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        )}
                        {printer.totalPrice > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px', textAlign: 'right' }}>
                            {progress.toFixed(0)}% paid off
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Paid Off Printers */}
            {paidOffPrinters.length > 0 && (
              <>
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Paid Off</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {paidOffPrinters.map(printer => (
                    <div
                      key={printer.id}
                      style={{
                        background: 'rgba(0, 255, 136, 0.1)',
                        border: '1px solid rgba(0, 255, 136, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Check size={14} style={{ color: '#00ff88' }} />
                      <span style={{ fontWeight: '500' }}>{printer.name}</span>
                      <span style={{ fontSize: '0.85rem', color: '#888' }}>
                        (${(printer.totalPrice || 0).toFixed(2)})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Summary */}
            {totalRemainingBalance > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#ff6b6b', fontWeight: '500' }}>Total Remaining Balance</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace' }}>
                  ${totalRemainingBalance.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Add/Edit Subscription Form Modal */}
      {showSubForm && (
        <div className="modal-overlay" onClick={closeSubForm}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingSubscription ? 'Edit Subscription' : 'Add Subscription'}</h2>
              <button className="modal-close" onClick={closeSubForm}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Service Name *</label>
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="e.g., Canva Pro, Etsy Ads"
                  value={newSubscription.name}
                  onChange={e => setNewSubscription({ ...newSubscription, name: e.target.value })}
                  style={{ width: '100%', padding: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="add-item-input"
                    placeholder="12.99"
                    value={newSubscription.price}
                    onChange={e => setNewSubscription({ ...newSubscription, price: e.target.value })}
                    style={{ width: '100%', padding: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Frequency</label>
                  <select
                    value={newSubscription.frequency}
                    onChange={e => setNewSubscription({ ...newSubscription, frequency: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  >
                    {frequencies.map(freq => (
                      <option key={freq.id} value={freq.id}>{freq.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Manage/Cancel URL</label>
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="e.g., canva.com/account or link to cancel page"
                  value={newSubscription.url}
                  onChange={e => setNewSubscription({ ...newSubscription, url: e.target.value })}
                  style={{ width: '100%', padding: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Notes</label>
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="e.g., Renews on 15th, Annual plan"
                  value={newSubscription.notes}
                  onChange={e => setNewSubscription({ ...newSubscription, notes: e.target.value })}
                  style={{ width: '100%', padding: '12px' }}
                />
              </div>

              <button className="btn btn-primary" onClick={saveSubscription} style={{ width: '100%', padding: '14px' }}>
                {editingSubscription ? <><Save size={20} /> Save Changes</> : <><Plus size={20} /> Add Subscription</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

// Finance Tab Component
function FinanceTab({ orders, archivedOrders, purchases, subscriptions, printers, teamMembers, showNotification }) {
  const [timePeriod, setTimePeriod] = useState('month');
  const [allocations, setAllocations] = useState(() => {
    try {
      const saved = localStorage.getItem('financeAllocations');
      return saved ? JSON.parse(saved) : [
        { id: 'savings', name: 'Savings', percentage: 20, color: '#00ff88' },
        { id: 'partners', name: 'Partner Split', percentage: 80, color: '#00ccff', isSplit: true }
      ];
    } catch {
      return [
        { id: 'savings', name: 'Savings', percentage: 20, color: '#00ff88' },
        { id: 'partners', name: 'Partner Split', percentage: 80, color: '#00ccff', isSplit: true }
      ];
    }
  });
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [newAllocation, setNewAllocation] = useState({ name: '', percentage: '' });
  const [editingAllocation, setEditingAllocation] = useState(null);

  // Save allocations to localStorage
  useEffect(() => {
    localStorage.setItem('financeAllocations', JSON.stringify(allocations));
  }, [allocations]);

  // Get date ranges based on time period
  const getDateRange = (period) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case 'all':
        start.setFullYear(2000);
        end.setFullYear(2100);
        break;
      default:
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
    }
    return { start, end };
  };

  const { start: periodStart, end: periodEnd } = getDateRange(timePeriod);

  // Calculate revenue from shipped orders (both active and archived)
  const allShippedOrders = [
    ...orders.filter(o => o.status === 'shipped'),
    ...archivedOrders
  ].filter(o => {
    const orderDate = new Date(o.shippedAt || o.fulfilledAt || o.createdAt);
    return orderDate >= periodStart && orderDate <= periodEnd;
  });

  const totalRevenue = allShippedOrders.reduce((sum, o) => {
    const price = parseFloat(o.price) || 0;
    const shippingCost = parseFloat(o.shippingCost) || 0;
    const salesTax = parseFloat(o.salesTax) || 0;
    return sum + price + shippingCost - salesTax;
  }, 0);

  // Calculate costs
  const periodPurchases = purchases.filter(p => {
    const purchaseDate = new Date(p.purchaseDate);
    return purchaseDate >= periodStart && purchaseDate <= periodEnd;
  });
  const totalPurchaseCosts = periodPurchases.reduce((sum, p) => sum + (parseFloat(p.totalCost) || 0), 0);

  // Calculate subscription costs for the period
  const getSubscriptionCostForPeriod = () => {
    const frequencies = {
      daily: { day: 1, week: 7, month: 30, year: 365, all: 365 },
      weekly: { day: 1/7, week: 1, month: 4.33, year: 52, all: 52 },
      monthly: { day: 1/30, week: 1/4.33, month: 1, year: 12, all: 12 },
      quarterly: { day: 1/90, week: 1/13, month: 1/3, year: 4, all: 4 },
      yearly: { day: 1/365, week: 1/52, month: 1/12, year: 1, all: 1 }
    };

    return subscriptions.reduce((sum, sub) => {
      const freq = frequencies[sub.frequency] || frequencies.monthly;
      const multiplier = freq[timePeriod] || 1;
      return sum + (parseFloat(sub.price) || 0) * multiplier;
    }, 0);
  };
  const totalSubscriptionCosts = getSubscriptionCostForPeriod();

  // Calculate printer payment costs for the period
  const getPrinterPaymentCostForPeriod = () => {
    const multipliers = { day: 1/30, week: 1/4.33, month: 1, year: 12, all: 12 };
    const multiplier = multipliers[timePeriod] || 1;

    return printers.reduce((sum, p) => {
      if (p.monthlyPayment > 0 && !p.isPaidOff) {
        return sum + (parseFloat(p.monthlyPayment) || 0) * multiplier;
      }
      return sum;
    }, 0);
  };
  const totalPrinterPayments = getPrinterPaymentCostForPeriod();

  // Calculate material costs from orders
  const totalMaterialCosts = allShippedOrders.reduce((sum, o) => sum + (parseFloat(o.materialCost) || 0), 0);

  // Total costs
  const totalCosts = totalPurchaseCosts + totalSubscriptionCosts + totalPrinterPayments + totalMaterialCosts;

  // Net profit
  const netProfit = totalRevenue - totalCosts;

  // Calculate allocations
  const partnerCount = teamMembers.length || 1;
  const calculatedAllocations = allocations.map(alloc => {
    const amount = (netProfit * alloc.percentage) / 100;
    return {
      ...alloc,
      amount: Math.max(0, amount),
      perPerson: alloc.isSplit ? Math.max(0, amount / partnerCount) : null
    };
  });

  // Update allocation percentage
  const updateAllocation = (id, newPercentage) => {
    const parsed = parseFloat(newPercentage) || 0;
    const currentTotal = allocations.reduce((sum, a) => a.id === id ? sum : sum + a.percentage, 0);
    const maxAllowed = 100 - currentTotal;
    const clamped = Math.min(Math.max(0, parsed), maxAllowed);

    setAllocations(allocations.map(a =>
      a.id === id ? { ...a, percentage: clamped } : a
    ));
  };

  // Add new allocation
  const addAllocation = () => {
    if (!newAllocation.name.trim()) {
      showNotification('Please enter allocation name', 'error');
      return;
    }
    const currentTotal = allocations.reduce((sum, a) => sum + a.percentage, 0);
    const percentage = Math.min(parseFloat(newAllocation.percentage) || 0, 100 - currentTotal);

    const colors = ['#ff9f43', '#a55eea', '#ff6b6b', '#ffc107', '#00ff88', '#00ccff'];
    const usedColors = allocations.map(a => a.color);
    const availableColor = colors.find(c => !usedColors.includes(c)) || '#888';

    setAllocations([...allocations, {
      id: `alloc-${Date.now()}`,
      name: newAllocation.name.trim(),
      percentage,
      color: availableColor,
      isSplit: false
    }]);
    setNewAllocation({ name: '', percentage: '' });
    setShowAddAllocation(false);
    showNotification('Allocation added');
  };

  // Delete allocation
  const deleteAllocation = (id) => {
    if (allocations.length <= 1) {
      showNotification('Must have at least one allocation', 'error');
      return;
    }
    setAllocations(allocations.filter(a => a.id !== id));
    showNotification('Allocation deleted');
  };

  // Toggle split between partners
  const toggleSplit = (id) => {
    setAllocations(allocations.map(a =>
      a.id === id ? { ...a, isSplit: !a.isSplit } : a
    ));
  };

  const totalAllocatedPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const periodLabels = {
    day: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    all: 'All Time'
  };

  return (
    <>
      <div className="section-header">
        <h2 className="page-title"><PieChart size={28} /> Finance</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['day', 'week', 'month', 'year', 'all'].map(period => (
            <button
              key={period}
              className={`btn ${timePeriod === period ? 'btn-primary' : 'btn-secondary'} btn-small`}
              onClick={() => setTimePeriod(period)}
              style={{ textTransform: 'capitalize' }}
            >
              {period === 'all' ? 'All Time' : period}
            </button>
          ))}
        </div>
      </div>

      {/* Profit Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Revenue ({periodLabels[timePeriod]})</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatCurrency(totalRevenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
            {allShippedOrders.length} orders
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Costs ({periodLabels[timePeriod]})</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatCurrency(totalCosts)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
            Purchases, subs, materials
          </div>
        </div>

        <div style={{
          background: netProfit >= 0
            ? 'linear-gradient(135deg, rgba(0, 204, 255, 0.1) 0%, rgba(0, 204, 255, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)',
          border: `1px solid ${netProfit >= 0 ? 'rgba(0, 204, 255, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Net Profit ({periodLabels[timePeriod]})</div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: netProfit >= 0 ? '#00ccff' : '#ff6b6b',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {formatCurrency(netProfit)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
            {((netProfit / totalRevenue) * 100 || 0).toFixed(1)}% margin
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
          <DollarSign size={20} style={{ color: '#ff6b6b' }} />
          Cost Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { name: 'Purchases', amount: totalPurchaseCosts, color: '#ff9f43' },
            { name: 'Subscriptions', amount: totalSubscriptionCosts, color: '#a55eea' },
            { name: 'Printer Payments', amount: totalPrinterPayments, color: '#00ccff' },
            { name: 'Material Costs', amount: totalMaterialCosts, color: '#00ff88' }
          ].filter(item => item.amount > 0).map(item => {
            const percentage = totalCosts > 0 ? (item.amount / totalCosts) * 100 : 0;
            return (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: item.color
                    }} />
                    {item.name}
                  </span>
                  <span style={{ fontWeight: '600', color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: item.color,
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            );
          })}
          {totalCosts === 0 && (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>No costs recorded for this period</p>
          )}
        </div>
      </div>

      {/* Profit Allocations */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', margin: 0 }}>
            <PieChart size={20} style={{ color: '#00ff88' }} />
            Profit Allocations
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '0.8rem',
              color: totalAllocatedPercentage === 100 ? '#00ff88' : '#ff9f43'
            }}>
              {totalAllocatedPercentage}% allocated
            </span>
            <button
              className="btn btn-primary btn-small"
              onClick={() => setShowAddAllocation(true)}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {calculatedAllocations.map(alloc => (
            <div
              key={alloc.id}
              style={{
                background: `${alloc.color}10`,
                border: `1px solid ${alloc.color}30`,
                borderRadius: '10px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: alloc.color
                  }} />
                  <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{alloc.name}</span>
                  {alloc.isSplit && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      background: 'rgba(0, 204, 255, 0.2)',
                      border: '1px solid rgba(0, 204, 255, 0.3)',
                      borderRadius: '4px',
                      color: '#00ccff'
                    }}>
                      Split {partnerCount} ways
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingAllocation === alloc.id ? (
                    <>
                      <input
                        type="number"
                        value={alloc.percentage}
                        onChange={(e) => updateAllocation(alloc.id, e.target.value)}
                        min="0"
                        max="100"
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ color: '#888' }}>%</span>
                      <button
                        className="btn btn-small"
                        onClick={() => setEditingAllocation(null)}
                        style={{ padding: '4px 8px' }}
                      >
                        <Check size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: alloc.color,
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                        {alloc.percentage}%
                      </span>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => setEditingAllocation(alloc.id)}
                        style={{ padding: '4px 8px' }}
                      >
                        <Edit2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>
                    {alloc.isSplit ? 'Total Amount' : 'Allocated Amount'}
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: alloc.color,
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {formatCurrency(alloc.amount)}
                  </div>
                </div>

                {alloc.isSplit && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>
                      Per Partner ({partnerCount})
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#fff',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      {formatCurrency(alloc.perPerson)}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => toggleSplit(alloc.id)}
                    title={alloc.isSplit ? 'Don\'t split' : 'Split between partners'}
                    style={{
                      padding: '6px 10px',
                      background: alloc.isSplit ? 'rgba(0, 204, 255, 0.2)' : 'transparent'
                    }}
                  >
                    <Users size={14} />
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => deleteAllocation(alloc.id)}
                    style={{ padding: '6px 10px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Unallocated warning */}
        {totalAllocatedPercentage < 100 && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255, 159, 67, 0.1)',
            border: '1px solid rgba(255, 159, 67, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={18} style={{ color: '#ff9f43' }} />
            <span style={{ color: '#ff9f43' }}>
              {100 - totalAllocatedPercentage}% of profit is unallocated ({formatCurrency((netProfit * (100 - totalAllocatedPercentage)) / 100)})
            </span>
          </div>
        )}
      </div>

      {/* Partner Breakdown */}
      {teamMembers.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
            <Users size={20} style={{ color: '#00ccff' }} />
            Partner Earnings ({periodLabels[timePeriod]})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {teamMembers.map(member => {
              const partnerEarnings = calculatedAllocations
                .filter(a => a.isSplit)
                .reduce((sum, a) => sum + (a.perPerson || 0), 0);
              return (
                <div
                  key={member.id}
                  style={{
                    background: 'rgba(0, 204, 255, 0.1)',
                    border: '1px solid rgba(0, 204, 255, 0.2)',
                    borderRadius: '10px',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: member.color || '#00ccff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#fff'
                  }}>
                    {member.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>{member.name}</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#00ccff',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {formatCurrency(partnerEarnings)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Allocation Modal */}
      {showAddAllocation && (
        <div className="modal-overlay" onClick={() => setShowAddAllocation(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Allocation</h2>
              <button className="modal-close" onClick={() => setShowAddAllocation(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Allocation Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Emergency Fund, Marketing"
                  value={newAllocation.name}
                  onChange={e => setNewAllocation({ ...newAllocation, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Percentage (max {100 - totalAllocatedPercentage}%)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="10"
                  min="0"
                  max={100 - totalAllocatedPercentage}
                  value={newAllocation.percentage}
                  onChange={e => setNewAllocation({ ...newAllocation, percentage: e.target.value })}
                />
              </div>

              <button className="btn btn-primary" onClick={addAllocation} style={{ width: '100%' }}>
                <Plus size={18} /> Add Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Archive Tab Component
function ArchiveTab({ archivedOrders, saveArchivedOrders, orders, setOrders, teamMembers, models, stores, showNotification }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'regular', 'historical'
  const [showImportModal, setShowImportModal] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [parsedOrders, setParsedOrders] = useState([]);
  const [importStoreId, setImportStoreId] = useState(stores[0]?.id || '');

  // Edit order state
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    item: '',
    quantity: 1,
    price: '',
    color: '',
    extra: '',
    shippingCost: '',
    salesTax: '',
    storeId: ''
  });

  // Create a replacement order from an archived order
  const createReplacementOrder = (archivedOrder) => {
    const replacementOrder = {
      id: `repl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: `REPL-${archivedOrder.orderId}`,
      item: archivedOrder.item,
      quantity: archivedOrder.quantity || 1,
      price: '$0.00', // Replacement is free
      buyerName: archivedOrder.buyerName || 'Replacement',
      color: archivedOrder.color || '',
      extra: archivedOrder.extra || '',
      status: 'pending',
      assignedTo: null,
      storeId: archivedOrder.storeId,
      isReplacement: true,
      originalOrderId: archivedOrder.orderId,
      createdAt: Date.now(),
      shippingCost: null,
      salesTax: 0
    };

    setOrders([...orders, replacementOrder]);
    showNotification(`Replacement order created for ${archivedOrder.item}`);
  };

  const startEditOrder = (order) => {
    setEditingOrder(order);
    setEditForm({
      item: order.item || '',
      quantity: order.quantity || 1,
      price: order.price || '',
      color: order.color || '',
      extra: order.extra || '',
      shippingCost: order.shippingCost !== null && order.shippingCost !== undefined ? order.shippingCost.toString() : '',
      salesTax: order.salesTax !== null && order.salesTax !== undefined ? order.salesTax.toString() : '',
      storeId: order.storeId || stores[0]?.id || ''
    });
  };

  const saveEditOrder = () => {
    if (!editingOrder) return;

    const updated = archivedOrders.map(o =>
      o.id === editingOrder.id
        ? {
            ...o,
            item: editForm.item,
            quantity: parseInt(editForm.quantity) || 1,
            price: editForm.price,
            color: editForm.color,
            extra: editForm.extra,
            shippingCost: editForm.shippingCost ? parseFloat(editForm.shippingCost) : null,
            salesTax: editForm.salesTax ? parseFloat(editForm.salesTax) : 0,
            storeId: editForm.storeId
          }
        : o
    );

    saveArchivedOrders(updated);
    setEditingOrder(null);
    showNotification('Order updated');
  };

  const closeEditModal = () => {
    setEditingOrder(null);
    setEditForm({
      item: '',
      quantity: 1,
      price: '',
      color: '',
      extra: '',
      shippingCost: '',
      salesTax: '',
      storeId: ''
    });
  };

  const deleteOrder = (orderId) => {
    if (confirm('Delete this archived order?')) {
      saveArchivedOrders(archivedOrders.filter(o => o.id !== orderId));
      showNotification('Order deleted');
    }
  };

  // Color values for parsing (same as main app)
  const colorValues = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'gray', 'grey', 'beige', 'navy', 'teal', 'coral', 'mint', 'lavender', 'maroon', 'olive',
    'cyan', 'magenta', 'gold', 'silver', 'bronze', 'cream', 'ivory', 'charcoal', 'burgundy',
    'sage', 'forest', 'rose', 'blush', 'mustard', 'rust', 'terracotta', 'slate', 'indigo',
    'natural', 'walnut', 'oak', 'maple', 'cherry', 'mahogany', 'espresso', 'clear', 'frosted'
  ];

  // Parse color field to separate color and extra (same logic as main app)
  const parseColorField = (colorField) => {
    if (!colorField) return { extractedColor: '', extractedExtra: '' };

    const skipLabels = ['tray color', 'stand color', 'color', 'size', 'style', 'type', 'option', 'not requested'];
    const parts = colorField.split(',').map(p => p.trim()).filter(p => p);

    let extractedColor = '';
    const extraParts = [];

    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      if (skipLabels.some(label => lowerPart === label || lowerPart.startsWith('not requested'))) continue;

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
      if (!isColor) extraParts.push(part);
    }

    return { extractedColor, extractedExtra: extraParts.join(', ') };
  };

  // Parse pasted order data (tab-separated: TXN, Product, Qty, Variations, Price, Tax)
  const parseHistoricalInput = (input) => {
    if (!input.trim()) {
      setParsedOrders([]);
      return;
    }

    const lines = input.trim().split('\n').map(l => l.trim()).filter(l => l);
    const orders = [];

    for (const line of lines) {
      const parts = line.split('\t').map(v => v.trim());
      if (parts.length >= 2) {
        const transactionId = parts[0] || '';
        const product = parts[1] || '';
        const quantity = parseInt(parts[2]) || 1;
        const variations = parts[3] || '';
        const price = parts[4] || '$0.00';
        // Parse tax - remove $ and parse as float
        const taxStr = parts[5] || '0';
        const salesTax = parseFloat(taxStr.replace(/[^0-9.]/g, '')) || 0;

        const { extractedColor, extractedExtra } = parseColorField(variations);

        orders.push({
          transactionId,
          product,
          quantity,
          color: extractedColor,
          extra: extractedExtra,
          price,
          salesTax
        });
      }
    }

    setParsedOrders(orders);
  };

  // Delete all historical orders
  const deleteHistoricalOrders = () => {
    if (window.confirm('Are you sure you want to delete ALL historical imported orders? This cannot be undone.')) {
      const nonHistorical = archivedOrders.filter(o => !o.isHistorical);
      saveArchivedOrders(nonHistorical);
      showNotification('All historical orders deleted');
    }
  };

  const filteredOrders = archivedOrders.filter(o => {
    const matchesSearch =
      o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.item?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = storeFilter === 'all' || o.storeId === storeFilter;
    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'historical' && o.isHistorical) ||
      (typeFilter === 'regular' && !o.isHistorical);
    return matchesSearch && matchesStore && matchesType;
  });

  const getMemberName = (id) => teamMembers.find(m => m.id === id)?.name || 'Unknown';

  // Find matching model by name
  const findMatchingModel = (order) => {
    return models?.find(m => {
      const modelName = m.name.toLowerCase();
      const orderItem = (order.item || '').toLowerCase();
      return orderItem.includes(modelName) || modelName.includes(orderItem);
    });
  };

  // Import historical orders from parsed data
  const importOrders = () => {
    if (parsedOrders.length === 0) {
      showNotification('No orders to import. Paste your order data first.', 'error');
      return;
    }

    const newOrders = parsedOrders.map(order => ({
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.transactionId || `HIST-${Date.now()}`,
      item: order.product || 'Unknown Item',
      quantity: order.quantity || 1,
      price: order.price || '$0.00',
      buyerName: 'Historical Import',
      color: order.color || '',
      status: 'shipped',
      archivedAt: Date.now(),
      isHistorical: true,
      assignedTo: null,
      shippingCost: null,
      storeId: importStoreId,
      extra: order.extra || '',
      salesTax: order.salesTax || 0
    }));

    saveArchivedOrders([...archivedOrders, ...newOrders]);
    showNotification(`Imported ${newOrders.length} historical orders`);
    setShowImportModal(false);
    setPasteInput('');
    setParsedOrders([]);
  };

  // Count historical vs regular orders
  const historicalCount = archivedOrders.filter(o => o.isHistorical).length;
  const regularCount = archivedOrders.length - historicalCount;

  return (
    <>
      <div className="section-header">
        <h2 className="page-title"><Archive size={28} /> Archived Orders</h2>
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={18} /> Import Historical
          </button>
          {historicalCount > 0 && (
            <button
              className="btn btn-secondary"
              onClick={deleteHistoricalOrders}
              style={{ marginLeft: '8px', color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.3)' }}
            >
              <Trash2 size={18} /> Delete Historical ({historicalCount})
            </button>
          )}
        </div>
      </div>

      {/* Stats - Clickable to filter */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div
          className="stat-card"
          onClick={() => setTypeFilter('all')}
          style={{
            cursor: 'pointer',
            border: typeFilter === 'all' ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          <div className="stat-label">Total Archived</div>
          <div className="stat-value">{archivedOrders.length}</div>
          {typeFilter === 'all' && <div style={{ fontSize: '0.7rem', color: '#00ff88', marginTop: '4px' }}>Showing All</div>}
        </div>
        <div
          className="stat-card"
          onClick={() => setTypeFilter('regular')}
          style={{
            cursor: 'pointer',
            border: typeFilter === 'regular' ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          <div className="stat-label">Regular Orders</div>
          <div className="stat-value">{regularCount}</div>
          {typeFilter === 'regular' && <div style={{ fontSize: '0.7rem', color: '#00ff88', marginTop: '4px' }}>Filtered</div>}
        </div>
        <div
          className="stat-card"
          onClick={() => setTypeFilter('historical')}
          style={{
            cursor: 'pointer',
            border: typeFilter === 'historical' ? '2px solid #00ccff' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          <div className="stat-label">Historical Imports</div>
          <div className="stat-value" style={{ color: '#00ccff' }}>{historicalCount}</div>
          {typeFilter === 'historical' && <div style={{ fontSize: '0.7rem', color: '#00ccff', marginTop: '4px' }}>Filtered</div>}
        </div>
      </div>

      <div className="archive-filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          type="text"
          className="filter-input"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, maxWidth: '300px' }}
        />
        <select
          className="filter-input"
          value={storeFilter}
          onChange={e => setStoreFilter(e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="all">All Stores</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '85vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">Import Historical Orders</h2>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Store Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#00ff88', fontSize: '0.9rem', fontWeight: '600' }}>
                  <Store size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Import to Store *
                </label>
                <select
                  value={importStoreId}
                  onChange={e => setImportStoreId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              {/* Paste Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>
                  Paste order data (tab-separated: Transaction ID, Product, Quantity, Variations, Price, Tax)
                </label>
                <textarea
                  value={pasteInput}
                  onChange={e => {
                    setPasteInput(e.target.value);
                    parseHistoricalInput(e.target.value);
                  }}
                  placeholder="Paste from Etsy or spreadsheet...&#10;4790820615&#9;Modern Hourglass Wall Sconce&#9;1&#9;Outer Shell Color, Power Type, Blue, Hard-Wired&#9;62.75&#9;4.72"
                  style={{
                    width: '100%',
                    height: '150px',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Preview */}
              {parsedOrders.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '8px', color: '#00ff88' }}>
                    Preview ({parsedOrders.length} orders found)
                  </h4>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>TXN ID</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>Product</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>Qty</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>Color</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>Extra</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>Price</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedOrders.slice(0, 5).map((order, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace' }}>{order.transactionId}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.product}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{order.quantity}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#00ccff' }}>{order.color || '-'}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffc107' }}>{order.extra || '-'}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#00ff88' }}>{order.price}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ff9f43' }}>${order.salesTax?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedOrders.length > 5 && (
                      <div style={{ padding: '8px', color: '#888', fontSize: '0.8rem', textAlign: 'center' }}>
                        ... and {parsedOrders.length - 5} more orders
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ color: '#ffc107', fontSize: '0.85rem', margin: 0 }}>
                  <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  These orders will be imported as historical data and won't appear in active orders.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setPasteInput(''); setParsedOrders([]); }}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={importOrders}
                  disabled={parsedOrders.length === 0}
                  style={{ opacity: parsedOrders.length === 0 ? 0.5 : 1 }}
                >
                  <Upload size={16} /> Import {parsedOrders.length} Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div key={order.orderId} className="order-card" style={{ opacity: 0.8, height: 'auto', minHeight: 'fit-content' }}>
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
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span className="order-id" style={{ fontSize: '0.75rem' }}>TXN: {order.orderId}</span>
                    {order.isHistorical && (
                      <span style={{
                        fontSize: '0.6rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(0, 204, 255, 0.2)',
                        color: '#00ccff',
                        border: '1px solid rgba(0, 204, 255, 0.3)',
                        whiteSpace: 'nowrap'
                      }}>
                        HISTORICAL
                      </span>
                    )}
                    <span className="status-badge status-shipped" style={{ marginLeft: 'auto' }}>
                      <Archive size={14} /> Archived
                    </span>
                  </div>
                  <div className="order-item" style={{ fontSize: '0.9rem', lineHeight: '1.3' }}>{order.item}</div>
                </div>
              </div>
              <div className="order-details">
                <div className="detail-item">
                  <span className="detail-label">Quantity</span>
                  <span className="detail-value">{order.quantity}</span>
                </div>
                {order.price && (
                  <div className="detail-item">
                    <span className="detail-label">Price</span>
                    <span className="detail-value" style={{ color: '#00ff88' }}>{order.price}</span>
                  </div>
                )}
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
                {!order.isHistorical && (
                  <div className="detail-item">
                    <span className="detail-label">Fulfilled By</span>
                    <span className="detail-value">{getMemberName(order.assignedTo)}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">{order.isHistorical ? 'Imported' : 'Archived'}</span>
                  <span className="detail-value">
                    {new Date(order.archivedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* External Parts Required */}
              {matchingModel?.externalParts?.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '6px' }}>
                    <Box size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Required Parts:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {matchingModel.externalParts.map((part, idx) => (
                      <span key={idx} style={{
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(0, 204, 255, 0.15)',
                        color: '#00ccff',
                        border: '1px solid rgba(0, 204, 255, 0.3)'
                      }}>
                        {part.name} x{part.quantity * (order.quantity || 1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <button
                  className="qty-btn"
                  onClick={() => createReplacementOrder(order)}
                  title="Create replacement order"
                  style={{
                    flex: 1,
                    width: 'auto',
                    height: '32px',
                    background: 'rgba(255, 159, 67, 0.2)',
                    border: '1px solid rgba(255, 159, 67, 0.3)',
                    color: '#ff9f43'
                  }}
                >
                  <RefreshCw size={14} style={{ marginRight: '6px' }} /> Replace
                </button>
                <button
                  className="qty-btn"
                  onClick={() => startEditOrder(order)}
                  title="Edit order"
                  style={{ flex: 1, width: 'auto', height: '32px' }}
                >
                  <Edit2 size={14} style={{ marginRight: '6px' }} /> Edit
                </button>
                <button
                  className="qty-btn"
                  onClick={() => deleteOrder(order.id)}
                  title="Delete order"
                  style={{ color: '#ff6b6b' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );})}
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Archived Order</h2>
              <button className="modal-close" onClick={closeEditModal}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(0, 204, 255, 0.1)',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#00ccff'
              }}>
                TXN: {editingOrder.orderId}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Item/Product Name</label>
                <input
                  type="text"
                  className="add-item-input"
                  value={editForm.item}
                  onChange={e => setEditForm({ ...editForm, item: e.target.value })}
                  style={{ width: '100%', padding: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="add-item-input"
                    value={editForm.quantity}
                    onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                    style={{ width: '100%', padding: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Price (e.g., $24.99)</label>
                  <input
                    type="text"
                    className="add-item-input"
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                    style={{ width: '100%', padding: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Color</label>
                  <input
                    type="text"
                    className="add-item-input"
                    value={editForm.color}
                    onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                    style={{ width: '100%', padding: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Extra/Variations</label>
                  <input
                    type="text"
                    className="add-item-input"
                    value={editForm.extra}
                    onChange={e => setEditForm({ ...editForm, extra: e.target.value })}
                    style={{ width: '100%', padding: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Shipping Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="add-item-input"
                    placeholder="0.00"
                    value={editForm.shippingCost}
                    onChange={e => setEditForm({ ...editForm, shippingCost: e.target.value })}
                    style={{ width: '100%', padding: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Sales Tax ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="add-item-input"
                    placeholder="0.00"
                    value={editForm.salesTax}
                    onChange={e => setEditForm({ ...editForm, salesTax: e.target.value })}
                    style={{ width: '100%', padding: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Store</label>
                <select
                  value={editForm.storeId}
                  onChange={e => setEditForm({ ...editForm, storeId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary" onClick={saveEditOrder} style={{ width: '100%', padding: '14px' }}>
                <Save size={20} /> Save Changes
              </button>
            </div>
          </div>
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

// Schedule Tab Component
function ScheduleTab({ orders, models, teamMembers, printers, setOrders }) {
  const [selectedMember, setSelectedMember] = useState('all');
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [showQueueOptimizer, setShowQueueOptimizer] = useState(false);

  // Helper to format duration
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Helper to format date/time
  const formatDateTime = (date) => {
    if (!date) return 'Not scheduled';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get printer name by id
  const getPrinterName = (printerId) => {
    const printer = printers?.find(p => p.id === printerId);
    return printer?.name || 'Not assigned';
  };

  // Helper to find model by name or alias
  const findModelByNameOrAlias = (itemName) => {
    if (!itemName) return null;
    const lowerItem = itemName.toLowerCase();
    return models.find(m => {
      // Check main name
      if (m.name.toLowerCase() === lowerItem) return true;
      if (m.name.toLowerCase().includes(lowerItem) || lowerItem.includes(m.name.toLowerCase())) return true;
      // Check aliases
      if (m.aliases && m.aliases.length > 0) {
        return m.aliases.some(alias => {
          const lowerAlias = alias.toLowerCase();
          return lowerAlias === lowerItem ||
                 lowerAlias.includes(lowerItem) ||
                 lowerItem.includes(lowerAlias);
        });
      }
      return false;
    });
  };

  // Get print duration for an order by matching to model and printer (sums all plates)
  const getPrintDuration = (order) => {
    // For extra prints, use the specified time directly
    if (order.isExtraPrint && order.extraPrintMinutes > 0) {
      return order.extraPrintMinutes;
    }

    const model = findModelByNameOrAlias(order.item);
    if (!model) return null;

    // Look up printer-specific duration, fallback to first printer's settings
    const printerSettings = model.printerSettings?.find(ps => ps.printerId === order.printerId) || model.printerSettings?.[0];
    if (printerSettings?.plates?.length > 0) {
      // Sum duration from all plates
      return printerSettings.plates.reduce((sum, plate) =>
        sum + ((parseInt(plate.printHours) || 0) * 60) + (parseInt(plate.printMinutes) || 0), 0);
    }
    return null;
  };

  // Get plates for an order (for detailed schedule display)
  const getOrderPlates = (order) => {
    const model = findModelByNameOrAlias(order.item);
    if (!model) return [];
    const printerSettings = model.printerSettings?.find(ps => ps.printerId === order.printerId) || model.printerSettings?.[0];
    return printerSettings?.plates || [];
  };

  // Calculate schedule for a team member
  const calculateSchedule = (memberId) => {
    const memberOrders = orders
      .filter(o => o.assignedTo === memberId && o.status === 'received')
      .map(o => ({
        ...o,
        printDuration: getPrintDuration(o),
        plates: getOrderPlates(o),
        scheduledStart: o.scheduledStart ? new Date(o.scheduledStart) : null
      }))
      .sort((a, b) => {
        // Sort by scheduled start if available, otherwise by created date
        const aTime = a.scheduledStart || new Date(a.createdAt);
        const bTime = b.scheduledStart || new Date(b.createdAt);
        return aTime - bTime;
      });

    // Calculate end times and chain prints together
    let lastEndTime = null;
    return memberOrders.map((order, idx) => {
      let startTime = order.scheduledStart;

      // If no scheduled start, use last end time or now
      if (!startTime) {
        startTime = lastEndTime || new Date();
      } else if (lastEndTime && startTime < lastEndTime) {
        // If scheduled start is before last end, push it to after last end
        startTime = lastEndTime;
      }

      const duration = order.printDuration || 60; // Default 1 hour if no duration
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      lastEndTime = endTime;

      return {
        ...order,
        calculatedStart: startTime,
        calculatedEnd: endTime,
        position: idx
      };
    });
  };

  // Update start time for an order and cascade to future orders
  const updateStartTime = (orderId, newTime) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId || o.orderId === orderId) {
        return { ...o, scheduledStart: newTime };
      }
      return o;
    });
    setOrders(updatedOrders);
    setEditingOrderId(null);
    setNewStartTime('');
  };

  // Get all scheduled orders grouped by member
  const getScheduleByMember = () => {
    const schedule = {};
    teamMembers.forEach(member => {
      schedule[member.id] = calculateSchedule(member.id);
    });
    return schedule;
  };

  const scheduleByMember = getScheduleByMember();
  const displayMembers = selectedMember === 'all'
    ? teamMembers
    : teamMembers.filter(m => m.id === selectedMember);

  // Smart Print Queue Optimizer - batch orders by color
  const getOptimizedQueue = () => {
    // Get all received orders
    const receivedOrders = orders.filter(o => o.status === 'received');

    // Group by color
    const colorGroups = {};
    receivedOrders.forEach(order => {
      const color = (order.color || 'Unknown').toLowerCase().trim();
      if (!colorGroups[color]) {
        colorGroups[color] = [];
      }
      colorGroups[color].push(order);
    });

    // Sort groups by number of orders (descending) to prioritize batches
    const sortedGroups = Object.entries(colorGroups)
      .map(([color, orders]) => ({
        color,
        orders,
        count: orders.length,
        totalQuantity: orders.reduce((sum, o) => sum + o.quantity, 0)
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate potential time saved
    const FILAMENT_CHANGE_TIME = 15; // minutes to change filament
    const currentChanges = receivedOrders.length - 1; // worst case: change every order
    const optimizedChanges = sortedGroups.length - 1;
    const timeSaved = (currentChanges - optimizedChanges) * FILAMENT_CHANGE_TIME;

    return {
      groups: sortedGroups,
      timeSaved,
      totalOrders: receivedOrders.length,
      uniqueColors: sortedGroups.length
    };
  };

  const optimizedQueue = getOptimizedQueue();

  return (
    <>
      <div className="section-header">
        <h2 className="page-title"><Clock size={28} /> Print Schedule</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className={`btn ${showQueueOptimizer ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowQueueOptimizer(!showQueueOptimizer)}
          >
            <Zap size={16} /> Queue Optimizer
          </button>
          <select
            className="form-input"
            value={selectedMember}
            onChange={e => setSelectedMember(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="all">All Team Members</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Smart Print Queue Optimizer Panel */}
      {showQueueOptimizer && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 204, 255, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)',
          border: '1px solid rgba(0, 204, 255, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#00ccff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <Zap size={24} /> Smart Queue Optimizer
            </h3>
            {optimizedQueue.timeSaved > 0 && (
              <div style={{
                background: 'rgba(0, 255, 136, 0.2)',
                border: '1px solid rgba(0, 255, 136, 0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#00ff88',
                fontWeight: '600'
              }}>
                Save ~{optimizedQueue.timeSaved} min by batching colors
              </div>
            )}
          </div>

          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>
            Group {optimizedQueue.totalOrders} orders into {optimizedQueue.uniqueColors} color batches to minimize filament changes.
          </p>

          {optimizedQueue.groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No orders in queue to optimize
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {optimizedQueue.groups.map((group, idx) => (
                <div key={group.color} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        background: 'rgba(0,204,255,0.2)',
                        color: '#00ccff',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        Batch {idx + 1}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: '#888',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }} />
                        <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{group.color}</span>
                      </div>
                    </div>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>
                      {group.count} order{group.count !== 1 ? 's' : ''} • {group.totalQuantity} total items
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {group.orders.map(order => (
                      <div key={order.orderId} style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ color: '#00ff88' }}>#{order.orderId.slice(-4)}</span>
                        <span style={{ color: '#666' }}>•</span>
                        <span style={{ color: '#fff', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.item?.slice(0, 25)}{order.item?.length > 25 ? '...' : ''}
                        </span>
                        <span style={{ color: '#00ccff' }}>x{order.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {displayMembers.map(member => {
        const memberSchedule = scheduleByMember[member.id] || [];

        return (
          <div key={member.id} style={{ marginBottom: '2rem' }}>
            <h3 style={{
              color: '#00ff88',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users size={20} />
              {member.name}
              <span style={{
                fontSize: '0.8rem',
                color: '#888',
                fontWeight: 'normal'
              }}>
                ({memberSchedule.length} prints queued)
              </span>
            </h3>

            {memberSchedule.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#666',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255,255,255,0.1)'
              }}>
                No prints scheduled
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {memberSchedule.map((order, idx) => (
                  <div
                    key={order.id || order.orderId}
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(0,204,255,0.05) 100%)',
                      border: '1px solid rgba(0,255,136,0.2)',
                      borderRadius: '12px',
                      padding: '1rem',
                      position: 'relative'
                    }}
                  >
                    {/* Position indicator */}
                    <div style={{
                      position: 'absolute',
                      left: '-12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#00ff88',
                      color: '#0a0a0f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}>
                      {idx + 1}
                    </div>

                    <div style={{ marginLeft: '12px' }}>
                      {/* Header row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                            {order.item}
                            {order.extra && (
                              <span style={{ color: '#00ccff', marginLeft: '8px', fontWeight: 'normal' }}>
                                {order.extra}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#888' }}>
                            {order.buyerName} • {order.color || 'No color specified'}
                            {order.quantity > 1 && ` • Qty: ${order.quantity}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {order.printerId && (
                            <div style={{
                              background: 'rgba(0,204,255,0.1)',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              color: '#00ccff',
                              marginBottom: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Printer size={12} />
                              {getPrinterName(order.printerId)}
                            </div>
                          )}
                          <div style={{
                            background: 'rgba(0,255,136,0.1)',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            color: '#00ff88'
                          }}>
                            {formatDuration(order.printDuration)}
                          </div>
                        </div>
                      </div>

                      {/* Plates breakdown */}
                      {order.plates?.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginBottom: '8px'
                        }}>
                          {order.plates.map((plate, pIdx) => {
                            const plateDuration = ((parseInt(plate.printHours) || 0) * 60) + (parseInt(plate.printMinutes) || 0);
                            return (
                              <span key={pIdx} style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                color: '#aaa',
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}>
                                {plate.name}: {formatDuration(plateDuration)}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Time row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#888' }}>Start:</span>
                          <span style={{ color: '#00ff88' }}>{formatDateTime(order.calculatedStart)}</span>
                        </div>
                        <ChevronRight size={16} style={{ color: '#444' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#888' }}>End:</span>
                          <span style={{ color: '#00ccff' }}>{formatDateTime(order.calculatedEnd)}</span>
                        </div>
                      </div>

                      {/* Edit start time */}
                      {editingOrderId === (order.id || order.orderId) ? (
                        <div style={{
                          marginTop: '12px',
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center'
                        }}>
                          <input
                            type="datetime-local"
                            className="form-input"
                            value={newStartTime}
                            onChange={e => setNewStartTime(e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => updateStartTime(order.id || order.orderId, new Date(newStartTime).toISOString())}
                          >
                            <Check size={14} /> Save
                          </button>
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => { setEditingOrderId(null); setNewStartTime(''); }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          {(() => {
                            const matchedModel = findModelByNameOrAlias(order.item);
                            if (!matchedModel?.file3mfUrl) return null;
                            const isUrl = matchedModel.file3mfUrl.startsWith('http');
                            return (
                              <button
                                className="btn btn-primary btn-small"
                                title={isUrl ? 'Open file' : 'Copy path to clipboard'}
                                onClick={() => {
                                  if (isUrl) {
                                    window.open(matchedModel.file3mfUrl, '_blank');
                                  } else {
                                    navigator.clipboard.writeText(matchedModel.file3mfUrl);
                                    alert('Path copied! Use ⌘+Shift+G in Finder to open.');
                                  }
                                }}
                              >
                                <Printer size={14} /> {isUrl ? 'Open 3MF' : 'Copy Path'}
                              </button>
                            );
                          })()}
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => {
                              setEditingOrderId(order.id || order.orderId);
                              const date = order.calculatedStart || new Date();
                              setNewStartTime(date.toISOString().slice(0, 16));
                            }}
                          >
                            <Edit2 size={14} /> Adjust Start Time
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// Printers Tab Component
function PrintersTab({ printers, savePrinters, orders, teamMembers, showNotification }) {
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterOwner, setNewPrinterOwner] = useState('');
  const [newPrinterHours, setNewPrinterHours] = useState('');
  const [newPrinterMonthlyPayment, setNewPrinterMonthlyPayment] = useState('');
  const [newPrinterTotalPrice, setNewPrinterTotalPrice] = useState('');
  const [newPrinterRemainingBalance, setNewPrinterRemainingBalance] = useState('');
  const [editingPrinter, setEditingPrinter] = useState(null);

  const addPrinter = () => {
    if (!newPrinterName.trim()) {
      showNotification('Please enter a printer name', 'error');
      return;
    }

    const printer = {
      id: `printer-${Date.now()}`,
      name: newPrinterName.trim(),
      totalHours: parseFloat(newPrinterHours) || 0,
      ownerId: newPrinterOwner || null,
      monthlyPayment: parseFloat(newPrinterMonthlyPayment) || 0,
      totalPrice: parseFloat(newPrinterTotalPrice) || 0,
      remainingBalance: parseFloat(newPrinterRemainingBalance) || 0,
      paymentStartDate: newPrinterMonthlyPayment ? Date.now() : null,
      isPaidOff: !newPrinterMonthlyPayment || parseFloat(newPrinterRemainingBalance) <= 0
    };

    savePrinters([...printers, printer]);
    setNewPrinterName('');
    setNewPrinterOwner('');
    setNewPrinterHours('');
    setNewPrinterMonthlyPayment('');
    setNewPrinterTotalPrice('');
    setNewPrinterRemainingBalance('');
    setShowAddPrinter(false);
    showNotification('Printer added');
  };

  const updatePrinter = (printerId, updates) => {
    const updated = printers.map(p =>
      p.id === printerId ? { ...p, ...updates } : p
    );
    savePrinters(updated);
    setEditingPrinter(null);
    showNotification('Printer updated');
  };

  const updatePrinterName = (printerId, newName) => {
    if (!newName.trim()) return;
    const updated = printers.map(p =>
      p.id === printerId ? { ...p, name: newName.trim() } : p
    );
    savePrinters(updated);
    setEditingPrinter(null);
    showNotification('Printer updated');
  };

  const getOwnerName = (ownerId) => {
    if (!ownerId) return 'Unassigned';
    const owner = teamMembers.find(m => m.id === ownerId);
    return owner ? owner.name : 'Unknown';
  };

  const formatHours = (hours) => {
    const h = parseFloat(hours) || 0;
    if (h === 0) return '0h';
    if (h < 1) return `${Math.round(h * 60)}m`;
    return `${h.toFixed(1)}h`;
  };

  const deletePrinter = (printerId) => {
    // Check if printer is assigned to any orders
    const assignedOrders = orders.filter(o => o.printerId === printerId);
    if (assignedOrders.length > 0) {
      showNotification(`Cannot delete: ${assignedOrders.length} orders assigned to this printer`, 'error');
      return;
    }

    if (printers.length <= 1) {
      showNotification('Cannot delete the last printer', 'error');
      return;
    }

    savePrinters(printers.filter(p => p.id !== printerId));
    showNotification('Printer deleted');
  };

  const getOrderCount = (printerId) => {
    return orders.filter(o => o.printerId === printerId && o.status === 'received').length;
  };

  return (
    <>
      <div className="section-header">
        <h2 className="page-title"><Printer size={28} /> Printers</h2>
        <button className="btn btn-primary" onClick={() => setShowAddPrinter(true)}>
          <Plus size={18} /> Add Printer
        </button>
      </div>

      {printers.length === 0 ? (
        <div className="empty-state">
          <Printer />
          <p>No printers added yet</p>
          <p style={{ fontSize: '0.85rem' }}>Add your 3D printers to track print times and filament usage per printer</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {printers.map(printer => (
            <div
              key={printer.id}
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(0,204,255,0.05) 100%)',
                border: '1px solid rgba(0,255,136,0.2)',
                borderRadius: '12px',
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <Printer size={24} style={{ color: '#00ff88' }} />
                {editingPrinter === printer.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      className="form-input"
                      defaultValue={printer.name}
                      autoFocus
                      placeholder="Printer name"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const name = e.target.value.trim();
                          if (name) updatePrinterName(printer.id, name);
                        }
                        if (e.key === 'Escape') setEditingPrinter(null);
                      }}
                      style={{ width: '200px' }}
                    />
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>Owner:</span>
                        <select
                          className="form-input"
                          defaultValue={printer.ownerId || ''}
                          onChange={e => updatePrinter(printer.id, { ownerId: e.target.value || null })}
                          style={{ width: '150px', padding: '4px 8px' }}
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>Hours:</span>
                        <input
                          type="number"
                          className="form-input"
                          defaultValue={printer.totalHours || 0}
                          step="0.1"
                          min="0"
                          onBlur={e => updatePrinter(printer.id, { totalHours: parseFloat(e.target.value) || 0 })}
                          style={{ width: '80px', padding: '4px 8px' }}
                        />
                      </div>
                    </div>
                    {/* Payment Fields */}
                    <div style={{
                      marginTop: '8px',
                      padding: '10px',
                      background: 'rgba(255, 159, 67, 0.1)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 159, 67, 0.2)'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#ff9f43', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DollarSign size={14} />
                        Payment Plan
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#888' }}>Total:</span>
                          <input
                            type="number"
                            className="form-input"
                            defaultValue={printer.totalPrice || ''}
                            step="0.01"
                            min="0"
                            placeholder="$0"
                            onBlur={e => updatePrinter(printer.id, { totalPrice: parseFloat(e.target.value) || 0 })}
                            style={{ width: '80px', padding: '4px 6px', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#888' }}>Remaining:</span>
                          <input
                            type="number"
                            className="form-input"
                            defaultValue={printer.remainingBalance || ''}
                            step="0.01"
                            min="0"
                            placeholder="$0"
                            onBlur={e => {
                              const remaining = parseFloat(e.target.value) || 0;
                              updatePrinter(printer.id, {
                                remainingBalance: remaining,
                                isPaidOff: remaining <= 0
                              });
                            }}
                            style={{ width: '80px', padding: '4px 6px', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#888' }}>Monthly:</span>
                          <input
                            type="number"
                            className="form-input"
                            defaultValue={printer.monthlyPayment || ''}
                            step="0.01"
                            min="0"
                            placeholder="$0"
                            onBlur={e => updatePrinter(printer.id, { monthlyPayment: parseFloat(e.target.value) || 0 })}
                            style={{ width: '80px', padding: '4px 6px', fontSize: '0.85rem' }}
                          />
                        </div>
                        {printer.remainingBalance > 0 && !printer.isPaidOff && (
                          <button
                            className="btn btn-small"
                            onClick={() => updatePrinter(printer.id, { isPaidOff: true, remainingBalance: 0 })}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              background: 'rgba(0, 255, 136, 0.2)',
                              border: '1px solid rgba(0, 255, 136, 0.3)',
                              color: '#00ff88'
                            }}
                          >
                            Mark Paid Off
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setEditingPrinter(null)}
                      style={{ padding: '4px 8px', alignSelf: 'flex-start', marginTop: '4px' }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{printer.name}</div>
                      {printer.monthlyPayment > 0 && !printer.isPaidOff && (
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'rgba(255, 159, 67, 0.2)',
                          color: '#ff9f43',
                          border: '1px solid rgba(255, 159, 67, 0.3)'
                        }}>
                          ${printer.monthlyPayment}/mo
                        </span>
                      )}
                      {printer.isPaidOff && printer.totalPrice > 0 && (
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'rgba(0, 255, 136, 0.2)',
                          color: '#00ff88',
                          border: '1px solid rgba(0, 255, 136, 0.3)'
                        }}>
                          PAID OFF
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#888', display: 'flex', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span>{getOrderCount(printer.id)} active prints</span>
                      <span style={{ color: '#00ccff' }}>
                        <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {formatHours(printer.totalHours || 0)} total
                      </span>
                      <span style={{ color: '#ff9f43' }}>
                        <User size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {getOwnerName(printer.ownerId)}
                      </span>
                      {printer.remainingBalance > 0 && !printer.isPaidOff && (
                        <span style={{ color: '#ff6b6b' }}>
                          <DollarSign size={14} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                          ${printer.remainingBalance.toFixed(2)} remaining
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setEditingPrinter(printer.id)}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => deletePrinter(printer.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Printer Modal */}
      {showAddPrinter && (
        <div className="modal-overlay" onClick={() => setShowAddPrinter(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Printer</h2>
              <button className="modal-close" onClick={() => setShowAddPrinter(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Printer Name</label>
              <input
                type="text"
                className="form-input"
                value={newPrinterName}
                onChange={e => setNewPrinterName(e.target.value)}
                placeholder="e.g., Bambu X1 Carbon"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Owner</label>
                <select
                  className="form-input"
                  value={newPrinterOwner}
                  onChange={e => setNewPrinterOwner(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ width: '120px' }}>
                <label className="form-label">Initial Hours</label>
                <input
                  type="number"
                  className="form-input"
                  value={newPrinterHours}
                  onChange={e => setNewPrinterHours(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Payment Section */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'rgba(255, 159, 67, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 159, 67, 0.2)'
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ff9f43', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} />
                Payment Plan (Optional)
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Total Price ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newPrinterTotalPrice}
                    onChange={e => setNewPrinterTotalPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Remaining Balance ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newPrinterRemainingBalance}
                    onChange={e => setNewPrinterRemainingBalance(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Monthly Payment ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newPrinterMonthlyPayment}
                    onChange={e => setNewPrinterMonthlyPayment(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => {
                setShowAddPrinter(false);
                setNewPrinterName('');
                setNewPrinterOwner('');
                setNewPrinterHours('');
                setNewPrinterMonthlyPayment('');
                setNewPrinterTotalPrice('');
                setNewPrinterRemainingBalance('');
              }}>Cancel</button>
              <button className="btn btn-primary" onClick={addPrinter}>
                <Save size={18} /> Add Printer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// Deploy 1768900960
