import { useState, useEffect, useRef } from 'react';
import {
  Database, Upload, FileText, FileSpreadsheet, Receipt,
  RefreshCw, CheckCircle, AlertCircle, Clock, Trash2, Eye,
  CreditCard, Save, DollarSign
} from 'lucide-react';
import { checkApiHealth, API_BASE_URL } from '../../lib/analyticsApi';

export default function DataHubTab({ showNotification }) {
  const [files, setFiles] = useState({
    etsy: [],
    bank: [],
    invoices: []
  });
  const [uploading, setUploading] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [lastSync, setLastSync] = useState(null);

  // Credit card config state
  const [ccConfig, setCcConfig] = useState({
    balance: 0,
    creditLimit: 0,
    totalCharged: 0,
    totalPaid: 0,
    availableCredit: 0
  });
  const [ccBalance, setCcBalance] = useState('');
  const [ccLimit, setCcLimit] = useState('');
  const [savingCc, setSavingCc] = useState(false);

  const etsyInputRef = useRef(null);
  const bankInputRef = useRef(null);
  const invoiceInputRef = useRef(null);

  useEffect(() => {
    checkConnection();
    loadFileHistory();
    loadCreditCardConfig();
  }, []);

  const checkConnection = async () => {
    const isConnected = await checkApiHealth();
    setApiStatus(isConnected ? 'connected' : 'disconnected');
  };

  const loadFileHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/data/files`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || { etsy: [], bank: [], invoices: [] });
        setLastSync(data.last_sync);
      }
    } catch {
      // File history not available
    }
  };

  const handleFileUpload = async (type, fileList) => {
    if (!fileList.length) return;

    setUploading(type);
    const formData = new FormData();

    for (const file of fileList) {
      formData.append('files', file);
    }
    formData.append('type', type);

    try {
      const response = await fetch(`${API_BASE_URL}/api/data/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        showNotification?.(`Successfully uploaded ${fileList.length} file(s)`, 'success');
        loadFileHistory();
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      showNotification?.(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleReprocess = async () => {
    setUploading('reprocess');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reload`);
      if (response.ok) {
        showNotification?.('Data reprocessed successfully', 'success');
        setLastSync(new Date().toISOString());
        loadCreditCardConfig(); // Refresh CC config after reload
      }
    } catch (err) {
      showNotification?.('Reprocess failed', 'error');
    } finally {
      setUploading(null);
    }
  };

  const loadCreditCardConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config/credit-card`);
      if (response.ok) {
        const data = await response.json();
        setCcConfig({
          balance: data.current_balance || 0,
          creditLimit: data.credit_limit || 0,
          totalCharged: data.total_charged || 0,
          totalPaid: data.total_paid || 0,
          availableCredit: data.available_credit || 0
        });
        setCcBalance(data.current_balance > 0 ? data.current_balance.toString() : '');
        setCcLimit(data.credit_limit > 0 ? data.credit_limit.toString() : '');
      }
    } catch {
      // Credit card config not available
    }
  };

  const handleSaveCreditCard = async () => {
    setSavingCc(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/config/credit-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: parseFloat(ccBalance) || 0,
          credit_limit: parseFloat(ccLimit) || 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCcConfig({
            balance: data.current_balance || 0,
            creditLimit: data.credit_limit || 0,
            totalCharged: data.total_charged || 0,
            totalPaid: data.total_paid || 0,
            availableCredit: data.available_credit || 0
          });
          showNotification?.('Credit card configuration saved', 'success');
        } else {
          throw new Error(data.error || 'Save failed');
        }
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      showNotification?.(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingCc(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={28} style={{ color: '#6366f1' }} />
          Data Hub
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StatusBadge status={apiStatus} />
          <button
            onClick={handleReprocess}
            disabled={uploading === 'reprocess'}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '8px',
              padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              opacity: uploading === 'reprocess' ? 0.5 : 1
            }}
          >
            <RefreshCw size={16} className={uploading === 'reprocess' ? 'spinning' : ''} />
            Reprocess All
          </button>
        </div>
      </div>

      {/* Last Sync Info */}
      {lastSync && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Clock size={16} style={{ color: '#059669' }} />
          <span style={{ color: '#059669', fontSize: '0.9rem' }}>
            Last data sync: {new Date(lastSync).toLocaleString()}
          </span>
        </div>
      )}

      {/* Upload Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>

        {/* Etsy CSV Upload */}
        <UploadCard
          title="Etsy Orders & Statements"
          description="Upload your Etsy CSV exports (Orders, Statements, Listings)"
          icon={FileSpreadsheet}
          color="#f59e0b"
          accept=".csv"
          inputRef={etsyInputRef}
          files={files.etsy}
          uploading={uploading === 'etsy'}
          onUpload={(e) => handleFileUpload('etsy', e.target.files)}
          onTrigger={() => etsyInputRef.current?.click()}
        />

        {/* Bank Statement Upload */}
        <UploadCard
          title="Bank Statements"
          description="Upload bank statement PDFs for transaction analysis"
          icon={FileText}
          color="#6366f1"
          accept=".pdf"
          inputRef={bankInputRef}
          files={files.bank}
          uploading={uploading === 'bank'}
          onUpload={(e) => handleFileUpload('bank', e.target.files)}
          onTrigger={() => bankInputRef.current?.click()}
        />

        {/* Invoice Upload */}
        <UploadCard
          title="Invoices & Receipts"
          description="Upload supplier invoices and expense receipts"
          icon={Receipt}
          color="#10b981"
          accept=".pdf,.jpg,.jpeg,.png"
          inputRef={invoiceInputRef}
          files={files.invoices}
          uploading={uploading === 'invoices'}
          onUpload={(e) => handleFileUpload('invoices', e.target.files)}
          onTrigger={() => invoiceInputRef.current?.click()}
        />
      </div>

      {/* Data Sources Overview */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a2e' }}>
          Data Sources Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <DataSourceCard
            name="Etsy Orders"
            status="active"
            records={files.etsy?.length || 0}
            lastUpdate={lastSync}
          />
          <DataSourceCard
            name="Bank Transactions"
            status={files.bank?.length > 0 ? 'active' : 'pending'}
            records={files.bank?.length || 0}
            lastUpdate={lastSync}
          />
          <DataSourceCard
            name="Invoices"
            status={files.invoices?.length > 0 ? 'active' : 'pending'}
            records={files.invoices?.length || 0}
            lastUpdate={lastSync}
          />
          <DataSourceCard
            name="Supabase Sync"
            status="active"
            records="Live"
            lastUpdate="Real-time"
          />
        </div>
      </div>

      {/* Credit Card Configuration */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={20} style={{ color: '#6366f1' }} />
          Business Credit Card
        </h3>
        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.9rem' }}>
          Track your business credit card balance for accurate liability reporting in the Valuation tab.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Current Balance Owed ($)
            </label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="number"
                value={ccBalance}
                onChange={(e) => setCcBalance(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Credit Limit ($)
            </label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="number"
                value={ccLimit}
                onChange={(e) => setCcLimit(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleSaveCreditCard}
              disabled={savingCc}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: savingCc ? '#94a3b8' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: savingCc ? 'wait' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {savingCc ? <RefreshCw size={16} className="spinning" /> : <Save size={16} />}
              {savingCc ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Current Credit Card Status */}
        {ccConfig.balance > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Balance Owed</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#dc2626' }}>
                ${ccConfig.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Credit Limit</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1a1a2e' }}>
                ${ccConfig.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Available Credit</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#059669' }}>
                ${ccConfig.availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Total Paid</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#3b82f6' }}>
                ${ccConfig.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '16px',
        padding: '20px',
        marginTop: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a2e' }}>
          How to Export Your Data
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <InstructionBox
            title="Etsy Orders CSV"
            steps={[
              'Go to Shop Manager → Settings → Options',
              'Click "Download Data" tab',
              'Select "Orders" and date range',
              'Click "Request CSV"'
            ]}
          />
          <InstructionBox
            title="Etsy Statements"
            steps={[
              'Go to Shop Manager → Finances → Payment account',
              'Click "Download Monthly Statements"',
              'Select month and download CSV'
            ]}
          />
          <InstructionBox
            title="Bank Statements"
            steps={[
              'Log into your bank account',
              'Navigate to Statements section',
              'Download PDF statements for each month'
            ]}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// Helper Components
function StatusBadge({ status }) {
  const styles = {
    connected: { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', text: 'Connected' },
    disconnected: { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', text: 'Disconnected' },
    checking: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', text: 'Checking...' }
  };
  const s = styles[status] || styles.checking;

  return (
    <div style={{
      background: s.bg,
      color: s.color,
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: s.color
      }} />
      {s.text}
    </div>
  );
}

function UploadCard({ title, description, icon: Icon, color, accept, inputRef, files, uploading, onUpload, onTrigger }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Icon size={22} style={{ color }} />
        <div>
          <div style={{ fontWeight: '600', color: '#1a1a2e' }}>{title}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{description}</div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={onUpload}
          style={{ display: 'none' }}
        />

        <button
          onClick={onTrigger}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '24px',
            border: `2px dashed ${color}40`,
            borderRadius: '12px',
            background: `${color}05`,
            cursor: uploading ? 'wait' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          {uploading ? (
            <>
              <RefreshCw size={28} style={{ color, animation: 'spin 1s linear infinite' }} />
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={28} style={{ color }} />
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Click to upload or drag files here
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                {accept.toUpperCase().replace(/\./g, '').replace(/,/g, ', ')}
              </span>
            </>
          )}
        </button>

        {files?.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
              Recent uploads ({files.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {files.slice(0, 3).map((file, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name || file}
                  </span>
                  <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DataSourceCard({ name, status, records, lastUpdate }) {
  const statusColors = {
    active: { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', icon: CheckCircle },
    pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', icon: Clock },
    error: { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', icon: AlertCircle }
  };
  const s = statusColors[status] || statusColors.pending;
  const StatusIcon = s.icon;

  return (
    <div style={{
      padding: '16px',
      background: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: '600', color: '#1a1a2e' }}>{name}</span>
        <div style={{
          padding: '4px 8px',
          borderRadius: '12px',
          background: s.bg,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <StatusIcon size={12} style={{ color: s.color }} />
          <span style={{ fontSize: '0.7rem', color: s.color, textTransform: 'capitalize' }}>{status}</span>
        </div>
      </div>
      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
        {typeof records === 'number' ? `${records} files` : records}
      </div>
    </div>
  );
}

function InstructionBox({ title, steps }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ fontWeight: '600', color: '#1a1a2e', marginBottom: '12px' }}>{title}</div>
      <ol style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '0.85rem' }}>
        {steps.map((step, i) => (
          <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
