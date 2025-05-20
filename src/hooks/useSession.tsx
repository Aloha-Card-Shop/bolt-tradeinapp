
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Session } from '../types/auth';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
  error: null
});

export const useSession = () => useContext(SessionContext);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Mock session for development purposes
    const mockSession = {
      user: {
        id: '1',
        email: 'user@example.com',
        user_metadata: {
          role: 'admin'
        }
      }
    };

    setTimeout(() => {
      setSession(mockSession);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading, error }}>
      {children}
    </SessionContext.Provider>
  );
};
