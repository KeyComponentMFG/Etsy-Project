import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Users, Key, AlertCircle, ArrowRight, Plus } from 'lucide-react';

export default function CompanySetup({ user, onComplete }) {
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to check if error is an AbortError
  const isAbortError = (err) => {
    return err?.message?.includes('AbortError') ||
           err?.message?.includes('signal is aborted') ||
           err?.name === 'AbortError';
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Creating company:', companyName, 'for user:', user.id);

    try {
      // First check if user already has a profile
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*, companies(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        console.log('User already has profile, completing:', existingProfile);
        onComplete({ companyId: existingProfile.company_id, role: existingProfile.role });
        return;
      }

      // Check if user already created a company
      let { data: existingCompany } = await supabase
        .from('companies')
        .select()
        .eq('created_by', user.id)
        .maybeSingle();

      let companyId;

      if (existingCompany) {
        console.log('Found existing company:', existingCompany);
        companyId = existingCompany.id;
      } else {
        // Create the company
        console.log('Creating new company...');
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
            created_by: user.id
          })
          .select()
          .single();

        if (companyError) {
          console.error('Company creation error:', companyError);

          // If AbortError, check if company was actually created
          if (isAbortError(companyError)) {
            console.log('AbortError on company insert, checking if it was created...');
            await new Promise(r => setTimeout(r, 500)); // Brief delay
            const { data: checkCompany } = await supabase
              .from('companies')
              .select()
              .eq('created_by', user.id)
              .maybeSingle();

            if (checkCompany) {
              console.log('Company was created despite AbortError:', checkCompany);
              companyId = checkCompany.id;
            } else {
              throw new Error('Failed to create company. Please try again.');
            }
          } else {
            throw companyError;
          }
        } else {
          console.log('Company created:', company);
          companyId = company.id;
        }
      }

      // Create user profile as admin
      console.log('Creating user profile for company:', companyId);
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          company_id: companyId,
          role: 'admin',
          display_name: user.email.split('@')[0],
          email: user.email
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);

        // If AbortError, check if profile was actually created
        if (isAbortError(profileError)) {
          console.log('AbortError on profile insert, checking if it was created...');
          await new Promise(r => setTimeout(r, 500)); // Brief delay
          const { data: checkProfile } = await supabase
            .from('user_profiles')
            .select()
            .eq('user_id', user.id)
            .maybeSingle();

          if (checkProfile) {
            console.log('Profile was created despite AbortError:', checkProfile);
            onComplete({ companyId, role: 'admin' });
            return;
          } else {
            throw new Error('Failed to create profile. Please try again.');
          }
        } else {
          throw profileError;
        }
      }

      console.log('Profile created, completing setup');
      onComplete({ companyId, role: 'admin' });
    } catch (err) {
      console.error('handleCreateCompany error:', err);
      setError(err.message || 'Failed to create company');
      setLoading(false);
    }
  };

  const handleJoinCompany = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Find company by invite code
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('invite_code', inviteCode.toLowerCase().trim())
        .single();

      if (companyError || !company) {
        throw new Error('Invalid invite code. Please check and try again.');
      }

      // Create user profile as member
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          company_id: company.id,
          role: 'member',
          display_name: user.email.split('@')[0],
          email: user.email
        });

      if (profileError) throw profileError;

      onComplete({ companyId: company.id, role: 'member' });
    } catch (err) {
      setError(err.message || 'Failed to join company');
    } finally {
      setLoading(false);
    }
  };

  // Mode selection screen
  if (!mode) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fc 0%, #e2e8f0 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Building2 size={32} color="#fff" />
            </div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#1a1a2e',
              margin: '0 0 8px'
            }}>
              Welcome to Business Manager
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              Get started by creating or joining a company
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={() => setMode('create')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#f8fafc';
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Plus size={24} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', color: '#1a1a2e', fontSize: '1.1rem' }}>
                  Create a New Company
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  Start fresh and invite your team members
                </p>
              </div>
              <ArrowRight size={20} color="#94a3b8" />
            </button>

            <button
              onClick={() => setMode('join')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#f8fafc';
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Users size={24} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', color: '#1a1a2e', fontSize: '1.1rem' }}>
                  Join an Existing Company
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  Enter an invite code from your admin
                </p>
              </div>
              <ArrowRight size={20} color="#94a3b8" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create company form
  if (mode === 'create') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fc 0%, #e2e8f0 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <button
            onClick={() => setMode(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '20px',
              padding: 0
            }}
          >
            &larr; Back
          </button>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Plus size={32} color="#fff" />
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1a1a2e',
              margin: '0 0 8px'
            }}>
              Create Your Company
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              You'll be the admin of this company
            </p>
          </div>

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

          <form onSubmit={handleCreateCompany}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Company Name
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 42px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Create Company
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Join company form
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8f9fc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <button
          onClick={() => setMode(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#6366f1',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '20px',
            padding: 0
          }}
        >
          &larr; Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Key size={32} color="#fff" />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1a1a2e',
            margin: '0 0 8px'
          }}>
            Join a Company
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Enter the invite code from your admin
          </p>
        </div>

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

        <form onSubmit={handleJoinCompany}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Invite Code
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter 8-character code"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  textTransform: 'lowercase'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading
                ? '#9ca3af'
                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Joining...
              </>
            ) : (
              <>
                <Users size={18} />
                Join Company
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
