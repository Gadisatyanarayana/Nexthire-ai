export const DatabaseConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  // Default bounds for db interactions
  maxPaginationLimit: 1000,
  defaultQueryTimeoutMs: 15000,
};

export const requireDatabaseConfig = () => {
  if (!DatabaseConfig.supabaseUrl || !DatabaseConfig.supabaseServiceKey) {
    throw new Error('CRITICAL: Missing Database Configuration');
  }
};
