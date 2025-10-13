import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🔍 Debug trigger function called');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      throw new Error('Missing Supabase configuration');
    }

    console.log('🔧 Supabase URL:', supabaseUrl);
    console.log('🔑 Service key available:', !!supabaseKey);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a unique test lead to avoid conflicts
    const timestamp = Date.now();
    const testLead = {
      dni: `1234567${timestamp.toString().slice(-1)}`, // Ensure unique DNI
      email: `test${timestamp}@example.com`
    };

    console.log('📝 Creating test lead:', testLead);

    // Create the lead using Supabase client
    const { data, error } = await supabase
      .from('catalog_leads')
      .insert(testLead)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test lead:', error);
      throw new Error(`Failed to create test lead: ${error.message}`);
    }

    console.log('✅ Test lead created successfully:', data);

    return new Response(JSON.stringify({
      success: true,
      message: 'Test lead created successfully',
      lead: data,
      debug: {
        timestamp,
        leadId: data?.id
      }
    }), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });

  } catch (error) {
    console.error('💥 Error in debug function:', error);
    
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
  }
});