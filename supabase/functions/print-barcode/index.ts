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
  cardId?: string | null;
  isTest?: boolean;
}

// ZPL to Image conversion function
const convertZplToImageBase64 = (zpl: string): string => {
  // This is a simplified server-side version of ZPL to image conversion
  // In a real implementation, you might want to use a proper ZPL rendering library
  // For now, we'll create a basic text representation that can be converted to image
  
  const lines = zpl.split('\n');
  const elements: Array<{type: string, x: number, y: number, content: string, fontSize?: number}> = [];
  
  let currentX = 0;
  let currentY = 0;
  let currentFontSize = 30;
  
  lines.forEach(line => {
    const foMatch = line.match(/\^FO(\d+),(\d+)/);
    if (foMatch) {
      currentX = parseInt(foMatch[1]);
      currentY = parseInt(foMatch[2]);
      return;
    }
    
    const fontMatch = line.match(/\^A0N,(\d+),(\d+)/);
    if (fontMatch) {
      currentFontSize = Math.max(8, Math.min(48, parseInt(fontMatch[1]) / 8));
      return;
    }
    
    const fdMatch = line.match(/\^FD(.+?)\^FS/);
    if (fdMatch) {
      elements.push({
        type: 'text',
        x: currentX,
        y: currentY,
        content: fdMatch[1],
        fontSize: currentFontSize
      });
    }
    
    const bcMatch = line.match(/\^BCN,(\d+)/);
    if (bcMatch && line.includes('^FD') && line.includes('^FS')) {
      const barcodeData = line.match(/\^FD(.+?)\^FS/)?.[1] || '';
      elements.push({
        type: 'barcode',
        x: currentX,
        y: currentY,
        content: barcodeData
      });
    }
  });
  
  // Create a simple HTML representation that can be converted to image
  // In production, you'd want to use a proper image generation library
  const htmlContent = `
    <div style="width: 384px; height: 288px; background: white; position: relative; font-family: monospace;">
      ${elements.map(el => {
        if (el.type === 'text') {
          return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; font-size: ${el.fontSize}px; color: black;">${el.content}</div>`;
        } else if (el.type === 'barcode') {
          return `
            <div style="position: absolute; left: ${el.x}px; top: ${el.y}px;">
              <div style="width: 200px; height: 50px; background: repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px);"></div>
              <div style="text-align: center; font-size: 10px; margin-top: 2px;">${el.content}</div>
            </div>
          `;
        }
        return '';
      }).join('')}
    </div>
  `;
  
  // For now, return a placeholder base64 image (1x1 white pixel)
  // In production, convert the HTML to an actual image
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const body: PrintRequest = await req.json();
    const { tradeInId, printerId, templateId, cardId, isTest = false } = body;

    if (!tradeInId || !printerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Print request received:', { tradeInId, printerId, templateId, cardId, isTest });

    // Get printer details including printer type
    const { data: printer, error: printerError } = await supabase
      .from('printers')
      .select('printer_id, name, printer_type')
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

    console.log('Printer details:', { 
      printerId: printer.printer_id, 
      name: printer.name, 
      type: printer.printer_type 
    });

    // Handle test prints differently
    if (isTest) {
      console.log('Processing test print request for printer type:', printer.printer_type);
      
      // Simple test content based on printer type
      let content: string;
      let contentType: string;
      
      if (printer.printer_type === 'RAW') {
        // For RAW printers, use image format
        const testZpl = `^XA^FO100,100^A0N,100,100^FDTEST^FS^FO100,250^A0N,50,50^FDPRINT OK^FS^XZ`;
        content = convertZplToImageBase64(testZpl);
        contentType = 'png_base64';
      } else {
        // For ZPL printers, use ZPL format
        const simpleTestZPL = `^XA^FO100,100^A0N,100,100^FDTEST^FS^FO100,250^A0N,50,50^FDPRINT OK^FS^XZ`;
        content = btoa(simpleTestZPL);
        contentType = 'raw_base64';
      }

      // If API key is not set, return mock success
      if (!PRINTNODE_API_KEY) {
        console.log('PRINTNODE_API_KEY not set, using mock print for test');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Test print completed successfully (MOCK MODE - ${printer.printer_type})`,
            printJobId: 'mock-test-' + Date.now()
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Sending test print to PrintNode:', {
        printerId: parseInt(printer.printer_id, 10),
        title: `TEST PRINT - ${printer.printer_type}`,
        contentType
      });

      const response = await fetch('https://api.printnode.com/printjobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(PRINTNODE_API_KEY + ':')}`
        },
        body: JSON.stringify({
          printerId: parseInt(printer.printer_id, 10),
          title: `TEST PRINT - ${printer.printer_type}`,
          contentType,
          content,
          source: `Lovable Trade-In System - ${printer.printer_type} TEST`
        })
      });

      if (!response.ok) {
        const printNodeError = await response.text();
        console.error('PrintNode API error for test print:', printNodeError);
        throw new Error(`PrintNode API Error: ${printNodeError}`);
      }
      
      const printNodeResponse = await response.json();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Test print sent successfully (${printer.printer_type} format)`,
          printJobId: printNodeResponse.id || 'unknown'
        }),
        {
          status: 200,
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

    // Get card data if cardId is provided
    let card = null;
    if (cardId) {
      const { data: tradeInItem, error: cardError } = await supabase
        .from('trade_in_items')
        .select(`
          id,
          card_id,
          card_name,
          quantity,
          price,
          condition,
          attributes,
          tcgplayer_url,
          image_url
        `)
        .eq('id', cardId)
        .eq('trade_in_id', tradeInId)
        .single();

      if (cardError) {
        console.error('Error fetching card:', cardError);
      } else {
        card = tradeInItem;
      }
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
      // Prepare card-related values if available
      const cardName = card?.card_name || '';
      const setName = card?.attributes?.setName || '';
      const cardNumber = card?.attributes?.cardNumber || '';
      const cardPrice = card?.price?.toFixed(2) || '0.00';
      const cardCondition = card?.condition || '';
      
      // Generate SKU if possible
      let sku = '';
      if (card && card.tcgplayer_url) {
        const tcgplayerIdMatch = card.tcgplayer_url.match(/\/(\d+)/);
        const tcgplayerId = tcgplayerIdMatch ? tcgplayerIdMatch[1] : undefined;
        
        if (tcgplayerId) {
          const isFirstEdition = !!card.attributes?.isFirstEdition;
          const isHolo = !!card.attributes?.isHolo;
          const isReverseHolo = false; // Default to false
          
          // Import the generateSku function or recreate its logic here
          // Since this is an edge function, we recreate the logic
          const getEditionHoloCode = (isFirstEd: boolean, isHoloCard: boolean, isReverseHoloCard: boolean) => {
            if (isFirstEd && isHoloCard) return 'fh'; // 1st edition holo
            if (isFirstEd) return 'fe'; // 1st edition
            if (isHoloCard) return 'ho'; // regular holo
            if (isReverseHoloCard) return 'rh'; // reverse holo
            return 'un'; // unlimited/normal
          };
          
          const getConditionCode = (cond: string) => {
            const conditionMap: Record<string, string> = {
              'near_mint': 'N',
              'lightly_played': 'L',
              'moderately_played': 'M',
              'heavily_played': 'H',
              'damaged': 'D'
            };
            
            return conditionMap[cond] || 'N';
          };
          
          const editionHoloCode = getEditionHoloCode(isFirstEdition, isHolo, isReverseHolo);
          const conditionCode = getConditionCode(card.condition);
          
          sku = `${tcgplayerId}-${editionHoloCode}${conditionCode}`;
        }
      }

      // Replace template placeholders with actual values
      zpl = template.zpl_template
        .replace(/\{\{customerName\}\}/g, customerName)
        .replace(/\{\{date\}\}/g, formattedDate)
        .replace(/\{\{totalValue\}\}/g, tradeIn.total_value.toFixed(2))
        .replace(/\{\{cashValue\}\}/g, tradeIn.cash_value.toFixed(2))
        .replace(/\{\{tradeValue\}\}/g, tradeIn.trade_value.toFixed(2))
        .replace(/\{\{tradeInId\}\}/g, tradeIn.id)
        .replace(/\{\{cardName\}\}/g, cardName)
        .replace(/\{\{setName\}\}/g, setName)
        .replace(/\{\{cardNumber\}\}/g, cardNumber)
        .replace(/\{\{cardPrice\}\}/g, cardPrice)
        .replace(/\{\{cardCondition\}\}/g, cardCondition)
        .replace(/\{\{sku\}\}/g, sku);
    } else {
      // Fallback to hardcoded ZPL if no template is found
      if (card) {
        // Generate SKU if possible
        let sku = '';
        if (card.tcgplayer_url) {
          const tcgplayerIdMatch = card.tcgplayer_url.match(/\/(\d+)/);
          const tcgplayerId = tcgplayerIdMatch ? tcgplayerIdMatch[1] : undefined;
          
          if (tcgplayerId) {
            const isFirstEdition = !!card.attributes?.isFirstEdition;
            const isHolo = !!card.attributes?.isHolo;
            const isReverseHolo = false; // Default to false
            
            // Recreate the SKU generation logic
            const getEditionHoloCode = (isFirstEd: boolean, isHoloCard: boolean, isReverseHoloCard: boolean) => {
              if (isFirstEd && isHoloCard) return 'fh';
              if (isFirstEd) return 'fe';
              if (isHoloCard) return 'ho';
              if (isReverseHoloCard) return 'rh';
              return 'un';
            };
            
            const getConditionCode = (cond: string) => {
              const conditionMap: Record<string, string> = {
                'near_mint': 'N',
                'lightly_played': 'L',
                'moderately_played': 'M',
                'heavily_played': 'H',
                'damaged': 'D'
              };
              
              return conditionMap[cond] || 'N';
            };
            
            const editionHoloCode = getEditionHoloCode(isFirstEdition, isHolo, isReverseHolo);
            const conditionCode = getConditionCode(card.condition);
            
            sku = `${tcgplayerId}-${editionHoloCode}${conditionCode}`;
          }
        }
        
        // Updated card-specific template with set name
        const setName = card.attributes?.setName || '';
        const cardInfo = [card.card_name, setName, card?.attributes?.cardNumber || '']
          .filter(Boolean).join(' • ');
        
        const skuDisplay = sku ? `SKU: ${sku}` : '';
          
        zpl = `^XA
^FO20,50^A0N,40,40^FD$${card.price?.toFixed(2) || '0.00'} | ${card.condition || ''}^FS
${skuDisplay ? `^FO20,90^A0N,25,25^FD${skuDisplay}^FS` : ''}
^FO50,${skuDisplay ? '140' : '120'}^BY3^BCN,100,Y,N,N^FD${sku || tradeIn.id}^FS
^FO20,250^A0N,25,25^FD${cardInfo}^FS
^XZ`;
      } else {
        // Standard trade-in template
        zpl = `^XA
^FO50,50^A0N,30,30^FD${customerName}^FS
^FO50,90^A0N,20,20^FD${formattedDate}^FS
^FO50,120^A0N,20,20^FD$${tradeIn.total_value.toFixed(2)}^FS
^FO50,170^BY3^BCN,100,Y,N,N^FD${tradeIn.id}^FS
^XZ`;
      }
    }

    // Determine content type and format based on printer type
    let content: string;
    let contentType: string;
    let printTitle: string;
    
    if (printer.printer_type === 'RAW') {
      // Convert ZPL to image for RAW printers
      content = convertZplToImageBase64(zpl);
      contentType = 'png_base64';
      printTitle = card ? `Card Label (Image) ${card.card_name}` : `Trade-In Label (Image) ${tradeIn.id}`;
    } else {
      // Use ZPL directly for ZPL printers
      content = btoa(zpl);
      contentType = 'raw_base64';
      printTitle = card ? `Card Label ${card.card_name}` : `Trade-In Label ${tradeIn.id}`;
    }

    console.log('Sending print job to PrintNode:', {
      printerId: parseInt(printer.printer_id, 10),
      title: printTitle,
      contentType,
      printerType: printer.printer_type
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
        title: printTitle,
        contentType,
        content,
        source: `Lovable Trade-In System - ${printer.printer_type}`
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
        message: `Print job submitted successfully (${printer.printer_type} format)`,
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
