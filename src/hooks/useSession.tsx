
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Session } from '../types/auth';

interface SessionContextType {
  user: any | null;
  loading: boolean;
  error: Error | null;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: () => {}
});

export const useSession = () => useContext(SessionContext);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SessionProvider initializing...');
    
    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname.includes('lovableproject.com');
    
    if (isDevelopment) {
      // Mock session for development - properly typed
      const mockSession: Session = {
        user: {
          id: '1',
          email: 'admin@alohacardshop.com',
          user_metadata: {
            role: 'admin' as const
          }
        }
      };

      console.log('Setting mock session for development:', mockSession);
      
      setTimeout(() => {
        setSession(mockSession);
        setLoading(false);
      }, 100);
    } else {
      // In production, you would check real authentication here
      console.log('Production mode - would check real auth');
      setLoading(false);
    }
  }, []);

  const signOut = () => {
    console.log('Signing out...');
    setSession(null);
    // Redirect to login page instead of root
    window.location.href = '/login';
  };

  const contextValue = {
    user: session?.user || null, 
    loading, 
    error: null,
    signOut
  };

  console.log('SessionProvider context value:', contextValue);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionProvider;
