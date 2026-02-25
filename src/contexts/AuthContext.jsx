import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  profileLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  setProfile: () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false); // Track if we've done initial check

  // Fetch user profile
  const fetchProfile = async (userId, keepExisting = false) => {
    console.log('=== FETCHING PROFILE ===');
    console.log('User ID:', userId);
    if (!userId) {
      console.log('No userId, skipping profile fetch');
      if (!keepExisting) setProfile(null);
      setProfileLoading(false);
      return null;
    }

    try {
      console.log('Making Supabase query...');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      );

      // First, fetch just the profile (without join to avoid RLS issues)
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])
        .catch(err => {
          console.error('Query failed or timed out:', err);
          return { data: null, error: err };
        });

      console.log('=== PROFILE QUERY RESULT ===');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('Profile query error:', error);
        // Don't clear profile on error if we already have one (e.g., token refresh failure)
        if (!keepExisting) setProfile(null);
        setProfileLoading(false);
        return null;
      }

      if (!data) {
        console.log('No profile found, user needs to set up company');
        // Only clear profile if this is initial load, not a refresh
        if (!keepExisting) setProfile(null);
        setProfileLoading(false);
        setProfileChecked(true);
        return null;
      }

      // Now fetch company separately if we have a company_id
      let company = null;
      if (data.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', data.company_id)
          .maybeSingle();
        company = companyData;
        console.log('Company data:', company);
      }

      console.log('Profile found:', data);
      setProfile({
        id: data.id,
        user_id: data.user_id,
        company_id: data.company_id,
        role: data.role,
        display_name: data.display_name,
        created_at: data.created_at,
        company: company
      });
      setProfileLoading(false);
      setProfileChecked(true);
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Don't clear profile on error if we already have one
      if (!keepExisting) setProfile(null);
      setProfileLoading(false);
      return null;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      setProfileLoading(true);
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Got session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fetch profile after getting session
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfileLoading(false);
      }
    }).catch((err) => {
      console.error('Error getting session:', err);
      setLoading(false);
      setProfileLoading(false);
    });

    // Fallback timeout - if still loading after 5 seconds, force stop
    const timeout = setTimeout(() => {
      setLoading(false);
      setProfileLoading(false);
    }, 5000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Fetch profile on auth change
        if (session?.user) {
          // On token refresh, keep existing profile if query fails
          const keepExisting = _event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED';
          await fetchProfile(session.user.id, keepExisting);
        } else if (_event === 'SIGNED_OUT') {
          // Only clear profile on explicit sign out
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    profileLoading,
    profileChecked,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    setProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
