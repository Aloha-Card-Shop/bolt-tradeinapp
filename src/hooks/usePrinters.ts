import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Printer, Location, PrinterModel } from '../types/printer';
import { toast } from 'react-hot-toast';

export const usePrinters = (locationId?: string) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [printerModels, setPrinterModels] = useState<PrinterModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch printer models
  const fetchPrinterModels = async () => {
    try {
      const { data, error } = await supabase
        .from('printer_models')
        .select('*')
        .order('brand', { ascending: true })
        .order('model', { ascending: true });
      
      if (error) throw error;
      setPrinterModels((data || []).map(model => ({
        ...model,
        printer_type: model.printer_type as 'ZPL' | 'RAW'
      })));
    } catch (err) {
      console.error('Error fetching printer models:', err);
    }
  };

  // Fetch all locations
  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setLocations((data || []).map(loc => ({
        ...loc,
        address: loc.address || undefined
      })));
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(`Error fetching locations: ${(err as Error).message}`);
    }
  };

  // Fetch printers, optionally filtered by location
  const fetchPrinters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('printers')
        .select(`*, locations (*)`)
        .order('name', { ascending: true });
      
      // Filter by location if provided
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Map data to strongly typed Printer objects
      const typedPrinters: Printer[] = (data || []).map(printer => ({
        id: printer.id,
        name: printer.name,
        printer_id: printer.printer_id,
        location_id: printer.location_id,
        is_default: printer.is_default || false,
        printer_type: (printer.printer_type || 'ZPL') as 'ZPL' | 'RAW',
        created_at: printer.created_at,
        location: printer.locations as unknown as Location
      }));
      
      setPrinters(typedPrinters);
    } catch (err) {
      console.error('Error fetching printers:', err);
      setError(`Error fetching printers: ${(err as Error).message}`);
      toast.error(`Failed to load printers: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new printer
  const addPrinter = async (printerData: Omit<Printer, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('printers')
        .insert([printerData])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // If this is set as default, update other printers in the same location
        if (printerData.is_default) {
          await supabase
            .from('printers')
            .update({ is_default: false })
            .eq('location_id', printerData.location_id)
            .neq('id', data[0].id);
        }
        
        await fetchPrinters();
        toast.success('Printer added successfully');
      }
    } catch (err) {
      console.error('Error adding printer:', err);
      toast.error(`Failed to add printer: ${(err as Error).message}`);
      throw err;
    }
  };

  // Update a printer
  const updatePrinter = async (id: string, printerData: Partial<Omit<Printer, 'id' | 'created_at'>>) => {
    try {
      const { error } = await supabase
        .from('printers')
        .update(printerData)
        .eq('id', id);
      
      if (error) throw error;
      
      // If this is set as default, update other printers in the same location
      if (printerData.is_default && printerData.location_id) {
        await supabase
          .from('printers')
          .update({ is_default: false })
          .eq('location_id', printerData.location_id)
          .neq('id', id);
      }
      
      await fetchPrinters();
      toast.success('Printer updated successfully');
    } catch (err) {
      console.error('Error updating printer:', err);
      toast.error(`Failed to update printer: ${(err as Error).message}`);
      throw err;
    }
  };

  // Delete a printer
  const deletePrinter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('printers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPrinters(currentPrinters => currentPrinters.filter(p => p.id !== id));
      toast.success('Printer removed successfully');
    } catch (err) {
      console.error('Error deleting printer:', err);
      toast.error(`Failed to delete printer: ${(err as Error).message}`);
      throw err;
    }
  };

  // Add a new location
  const addLocation = async (locationData: Omit<Location, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert([locationData])
        .select();
      
      if (error) throw error;
      
      await fetchLocations();
      toast.success('Location added successfully');
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('Error adding location:', err);
      toast.error(`Failed to add location: ${(err as Error).message}`);
      throw err;
    }
  };

  // Update a location
  const updateLocation = async (id: string, locationData: Partial<Omit<Location, 'id' | 'created_at'>>) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update(locationData)
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchLocations();
      toast.success('Location updated successfully');
    } catch (err) {
      console.error('Error updating location:', err);
      toast.error(`Failed to update location: ${(err as Error).message}`);
      throw err;
    }
  };

  // Delete a location
  const deleteLocation = async (id: string) => {
    try {
      // First check if this location has any printers
      const { data: printerData, error: printerError } = await supabase
        .from('printers')
        .select('id')
        .eq('location_id', id);
      
      if (printerError) throw printerError;
      
      if (printerData && printerData.length > 0) {
        toast.error('Cannot delete location with assigned printers. Remove printers first.');
        return false;
      }
      
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setLocations(currentLocations => currentLocations.filter(l => l.id !== id));
      toast.success('Location removed successfully');
      return true;
    } catch (err) {
      console.error('Error deleting location:', err);
      toast.error(`Failed to delete location: ${(err as Error).message}`);
      throw err;
    }
  };

  useEffect(() => {
    fetchPrinters();
    fetchLocations();
    fetchPrinterModels();
  }, [locationId]);

  return {
    printers,
    locations,
    printerModels,
    isLoading,
    error,
    fetchPrinters,
    fetchLocations,
    fetchPrinterModels,
    addPrinter,
    updatePrinter,
    deletePrinter,
    addLocation,
    updateLocation,
    deleteLocation
  };
};