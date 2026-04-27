/*
  # Grant RPC access to generate_invoice_number function

  1. Changes
    - Grant EXECUTE on generate_invoice_number to authenticated users
    - This allows the frontend to call supabase.rpc('generate_invoice_number')
*/

GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;