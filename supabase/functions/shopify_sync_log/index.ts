
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateAdmin, createResponse, createClients, handleCors } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate the user
    const { userId, role, error: authError } = await authenticateAdmin(req);
    
    if (authError) {
      return createResponse({ success: false, error: authError }, 403);
    }
    
    // Parse the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return createResponse({ 
        success: false, 
        error: "Invalid request body format" 
      }, 400);
    }
    
    const { tradeInId, itemId, status, message } = requestBody;
    
    if (!tradeInId || !status) {
      return createResponse({ 
        success: false, 
        error: "Missing required fields: tradeInId and status are required" 
      }, 400);
    }
    
    // Get admin client to bypass RLS
    const { adminSupabase } = createClients();
    
    // Insert log entry
    const { data: logEntry, error: insertError } = await adminSupabase
      .from("shopify_sync_logs")
      .insert({
        trade_in_id: tradeInId,
        item_id: itemId || null,
        status,
        message: message || null,
        created_by: userId
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Failed to insert log:", insertError);
      return createResponse({ 
        success: false, 
        error: `Failed to create log: ${insertError.message}` 
      }, 500);
    }
    
    // Return success response
    return createResponse({ 
      success: true, 
      data: logEntry,
      message: "Log entry created successfully" 
    });
    
  } catch (error) {
    console.error("Error in shopify_sync_log function:", error);
    return createResponse({ 
      success: false, 
      error: error.message || "Internal server error" 
    }, 500);
  }
});
