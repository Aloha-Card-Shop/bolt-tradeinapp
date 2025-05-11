
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client setup
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// PrintNode API settings
const PRINTNODE_API_KEY = Deno.env.get('PRINTNODE_API_KEY') || '';

interface PrintRequest {
  tradeInId: string;
  printerId: string;
  templateId?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const body: PrintRequest = await req.json();
    const { tradeInId, printerId, templateId } = body;

    if (!tradeInId || !printerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get trade-in data
    const { data: tradeIn, error: tradeInError } = await supabase
      .from('trade_ins')
      .select(`
        id, 
        trade_in_date, 
        total_value, 
        cash_value,
        trade_value,
        status,
        customers (first_name, last_name)
      `)
      .eq('id', tradeInId)
      .single();

    if (tradeInError || !tradeIn) {
      console.error('Error fetching trade-in:', tradeInError);
      return new Response(
        JSON.stringify({ error: `Trade-in not found: ${tradeInError?.message || 'Unknown error'}` }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get printer details
    const { data: printer, error: printerError } = await supabase
      .from('printers')
      .select('printer_id, name')
      .eq('id', printerId)
      .single();

    if (printerError || !printer) {
      console.error('Error fetching printer:', printerError);
      return new Response(
        JSON.stringify({ error: `Printer not found: ${printerError?.message || 'Unknown error'}` }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get selected template or default template if none specified
    let template = null;

    if (templateId) {
      const { data: selectedTemplate, error: templateError } = await supabase
        .from('barcode_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (templateError) {
        console.error('Error fetching template:', templateError);
      } else {
        template = selectedTemplate;
      }
    }

    if (!template) {
      const { data: defaultTemplate, error: defaultTemplateError } = await supabase
        .from('barcode_templates')
        .select('*')
        .eq('is_default', true)
        .single();
      
      if (defaultTemplateError) {
        console.error('Error fetching default template:', defaultTemplateError);
      } else {
        template = defaultTemplate;
      }
    }

    // If API key is not set, use mock implementation
    if (!PRINTNODE_API_KEY) {
      console.log('PRINTNODE_API_KEY not set, using mock print');
      
      // Return mock success response
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Print job submitted successfully (MOCK MODE)',
          printJobId: 'mock-print-job-' + Date.now()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // For real PrintNode integration
    const customerName = tradeIn.customers 
      ? `${tradeIn.customers.first_name} ${tradeIn.customers.last_name}` 
      : 'Unknown Customer';
    
    const formattedDate = new Date(tradeIn.trade_in_date).toLocaleDateString();
    
    // Generate ZPL content
    let zpl;
    if (template && template.zpl_template) {
      // Replace template placeholders with actual values
      zpl = template.zpl_template
        .replace(/\{\{customerName\}\}/g, customerName)
        .replace(/\{\{date\}\}/g, formattedDate)
        .replace(/\{\{totalValue\}\}/g, tradeIn.total_value.toFixed(2))
        .replace(/\{\{cashValue\}\}/g, tradeIn.cash_value.toFixed(2))
        .replace(/\{\{tradeValue\}\}/g, tradeIn.trade_value.toFixed(2))
        .replace(/\{\{tradeInId\}\}/g, tradeIn.id);
    } else {
      // Fallback to hardcoded ZPL if no template is found
      zpl = `^XA
^FO50,50^A0N,30,30^FD${customerName}^FS
^FO50,90^A0N,20,20^FD${formattedDate}^FS
^FO50,120^A0N,20,20^FD$${tradeIn.total_value.toFixed(2)}^FS
^FO50,170^BY3^BCN,100,Y,N,N^FD${tradeIn.id}^FS
^XZ`;
    }

    const base64Content = btoa(zpl);
    
    console.log('Sending print job to PrintNode:', {
      printerId: parseInt(printer.printer_id, 10),
      title: `Trade-In Label ${tradeIn.id}`,
      contentType: 'raw_base64',
      content: 'Base64 ZPL data (truncated for logs)'
    });

    // Make request to PrintNode API
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(PRINTNODE_API_KEY + ':')}`
      },
      body: JSON.stringify({
        printerId: parseInt(printer.printer_id, 10),
        title: `Trade-In Label ${tradeIn.id}`,
        contentType: 'raw_base64',
        content: base64Content,
        source: 'Lovable Trade-In System'
      })
    });

    if (!response.ok) {
      const printNodeError = await response.text();
      console.error('PrintNode API error:', printNodeError);
      throw new Error(`PrintNode API Error: ${printNodeError}`);
    }
    
    const printNodeResponse = await response.json();
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Print job submitted successfully',
        printJobId: printNodeResponse.id || 'unknown'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error processing print request:', error);
    
    return new Response(
      JSON.stringify({ error: `Failed to process print request: ${(error as Error).message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
