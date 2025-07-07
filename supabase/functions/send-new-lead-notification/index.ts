import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadData {
  id: string;
  dni?: string;
  email: string;
  status: string;
  created_at: string;
}

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: LeadData;
  schema: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: WebhookPayload = await req.json()
    
    // Verificar que es un INSERT en la tabla catalog_leads
    if (payload.type !== 'INSERT' || payload.table !== 'catalog_leads') {
      return new Response('Not a catalog_leads insert', { 
        status: 200,
        headers: corsHeaders 
      })
    }

    const lead = payload.record;
    
    // Configurar Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found')
      return new Response('API key not configured', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Preparar el contenido del correo
    const emailSubject = '🔔 Nueva solicitud de acceso al catálogo'
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nueva Solicitud de Acceso</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Detalles del Lead</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${lead.email}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">DNI:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${lead.dni || 'No proporcionado'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Estado:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${lead.status === 'pending' ? 'Pendiente' : lead.status}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #555;">Fecha de solicitud:</td>
                <td style="padding: 10px 0; color: #333;">${new Date(lead.created_at).toLocaleString('es-AR')}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://app.')}/project/_/editor" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver en Panel de Administración
            </a>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 6px; border-left: 4px solid #0284c7;">
            <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
              <strong>💡 Próximos pasos:</strong><br>
              1. Revisa la información del lead<br>
              2. Verifica la documentación si es necesario<br>
              3. Aprueba o rechaza la solicitud desde el panel de administración
            </p>
          </div>
        </div>
        
        <div style="background: #374151; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            Este es un correo automático generado por el sistema de Accicom.<br>
            No responder a este correo.
          </p>
        </div>
      </div>
    `

    // Enviar el correo usando Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sistema Accicom <noreply@accicom.com.ar>',
        to: ['atencion@accicom.com.ar'], // Cambia por tu email interno
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Error sending email:', errorText)
      return new Response(`Error sending email: ${errorText}`, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Notification sent successfully',
      emailId: emailResult.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in webhook handler:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})