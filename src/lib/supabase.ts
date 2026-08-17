import { createClient } from '@supabase/supabase-js';
import type { SparePart } from '../types/inventory';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('.supabase.co'));

// Initialize Supabase Client (Dummy client fallback if environment variables are not configured yet)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createClient('https://placeholder.supabase.co', 'placeholder-anon-key') as any);

/**
 * Cloud Sync Status Banner
 */
export const getCloudSyncStatus = () => {
  return {
    isConfigured: isSupabaseConfigured,
    mode: isSupabaseConfigured ? 'CONNECTED_SUPABASE_CLOUD' : 'OFFLINE_LOCAL_STORAGE',
    message: isSupabaseConfigured
      ? 'Database Cloud Supabase Terhubung secara Realtime'
      : 'Mode Offline LocalStorage (Konfigurasi VITE_SUPABASE_URL untuk mengaktifkan Cloud Sync)'
  };
};

/** Helper functions for products */
export const fetchProducts = async (): Promise<SparePart[]> => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Supabase fetchProducts error:', error);
    throw error;
  }
  return data as SparePart[];
};

export const addProduct = async (product: Omit<SparePart, 'id' | 'terakhirDiupdate'>): Promise<SparePart> => {
  const { data, error } = await supabase.from('products').insert([product]);
  if (error) {
    console.error('Supabase addProduct error:', error);
    throw error;
  }
  return data[0] as SparePart;
};
