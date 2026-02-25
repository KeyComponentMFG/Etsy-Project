import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users, Shield, ShieldCheck, Copy, RefreshCw,
  UserMinus, AlertCircle, CheckCircle, X
} from 'lucide-react';

export default function AdminPanel({ companyId, onClose }) {
  const [company, setCompany] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copying, setCopying] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Fetch all members
      const { data: membersData, error: membersError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData);
    } catch (err) {
      setError(err.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(company.invite_code);
      setSuccess('Invite code copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to copy invite code');
    } finally {
      setCopying(false);
    }
  };

  const regenerateInviteCode = async () => {
    setRegenerating(true);
    setError('');
    try {
      const newCode = Math.random().toString(36).substring(2, 10);
      const { error } = await supabase
        .from('companies')
        .update({ invite_code: newCode })
        .eq('id', companyId);

      if (error) throw error;
      setCompany({ ...company, invite_code: newCode });
      setSuccess('Invite code regenerated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to regenerate invite code');
    } finally {
      setRegenerating(false);
    }
  };

  const toggleRole = async (memberId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setError('');
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      setMembers(members.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ));
      setSuccess(`User role updated to ${newRole}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    }
  };

  const removeMember = async (memberId, memberUserId) => {
    if (!confirm('Are you sure you want to remove this member from the company?')) {
      return;
    }
    setError('');
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      setMembers(members.filter(m => m.id !== memberId));
      setSuccess('Member removed from company');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a1a2e' }}>
                Admin Panel
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {company?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#64748b'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Alerts */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#dc2626'
            }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: '0.9rem' }}>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#059669'
            }}>
              <CheckCircle size={18} />
              <span style={{ fontSize: '0.9rem' }}>{success}</span>
            </div>
          )}

          {/* Invite Code Section */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#374151' }}>
              Invite Code
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#64748b' }}>
              Share this code with team members so they can join your company
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontFamily: 'monospace',
                fontSize: '1.25rem',
                fontWeight: '600',
                letterSpacing: '2px',
                color: '#1a1a2e',
                textAlign: 'center'
              }}>
                {company?.invite_code?.toUpperCase()}
              </div>
              <button
                onClick={copyInviteCode}
                disabled={copying}
                style={{
                  padding: '12px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Copy code"
              >
                <Copy size={20} color="#64748b" />
              </button>
              <button
                onClick={regenerateInviteCode}
                disabled={regenerating}
                style={{
                  padding: '12px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Generate new code"
              >
                <RefreshCw
                  size={20}
                  color="#64748b"
                  style={{
                    animation: regenerating ? 'spin 1s linear infinite' : 'none'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Members Section */}
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#374151' }}>
              Team Members ({members.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: '10px'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: member.role === 'admin'
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    {(member.display_name || member.email || '?')[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '500',
                      color: '#1a1a2e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {member.display_name || member.email || 'Unknown'}
                      {member.role === 'admin' && (
                        <span style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <ShieldCheck size={12} />
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleRole(member.id, member.role)}
                      style={{
                        padding: '8px 12px',
                        background: member.role === 'admin' ? '#f1f5f9' : '#fef3c7',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        color: member.role === 'admin' ? '#64748b' : '#92400e',
                        fontWeight: '500'
                      }}
                    >
                      {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    {members.length > 1 && (
                      <button
                        onClick={() => removeMember(member.id, member.user_id)}
                        style={{
                          padding: '8px',
                          background: '#fef2f2',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#dc2626'
                        }}
                        title="Remove member"
                      >
                        <UserMinus size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
