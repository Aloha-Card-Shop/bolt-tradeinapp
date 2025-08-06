import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check authentication status first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!session?.user) {
        throw new Error('Authentication required');
      }

      console.log('Fetching customers with session:', {
        userId: session.user.id,
        role: session.user.role
      });

      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .order('last_name, first_name');

      if (fetchError) {
        console.error('Database error:', fetchError);
        throw new Error(`Failed to fetch customers: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error('No data received from database');
      }

      setCustomers(data.map(customer => ({
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email || '',
        phone: customer.phone || ''
      })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      console.error('Error in fetchCustomers:', err);
      setError(errorMessage);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const createCustomer = async (
    firstName: string,
    lastName: string,
    email?: string,
    phone?: string
  ): Promise<Customer> => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!session?.user) {
        throw new Error('Authentication required');
      }

      console.log('Creating customer with session:', {
        userId: session.user.id,
        role: session.user.role
      });

      // First check if customer exists by email
      if (email) {
        const { data: existingCustomer, error: checkError } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email, phone')
          .eq('email', email)
          .maybeSingle();

        if (checkError) {
          throw new Error(`Error checking existing customer: ${checkError.message}`);
        }

        if (existingCustomer) {
          // Update existing customer
          const { data, error: updateError } = await supabase
            .from('customers')
            .update({
              first_name: firstName,
              last_name: lastName,
              phone: phone || null
            })
            .eq('id', existingCustomer.id)
            .select()
            .single();

          if (updateError) throw updateError;

          const updatedCustomer = {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email || '',
            phone: data.phone || ''
          };

          setCustomers(prev => prev.map(c => 
            c.id === updatedCustomer.id ? updatedCustomer : c
          ));

          return updatedCustomer;
        }
      }

      // Insert new customer
      const { data, error: insertError } = await supabase
        .from('customers')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phone || null
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Error creating customer: ${insertError.message}`);
      }

      const newCustomer = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email || '',
        phone: data.phone || ''
      };

      setCustomers(prev => [...prev, newCustomer]);

      return newCustomer;
    } catch (err) {
      console.error('Error in createCustomer:', err);
      throw err;
    }
  };

  return {
    customers,
    isLoading,
    error,
    createCustomer,
    refreshCustomers: fetchCustomers
  };
};