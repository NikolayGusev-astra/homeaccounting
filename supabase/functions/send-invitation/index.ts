import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get request body
    const { invitationId, familyAccountName, invitedBy, appUrl } = await req.json()

    if (!invitationId) {
      throw new Error('invitationId is required')
    }

    // Get invitation details
    const { data: invitation, error: fetchError } = await supabaseClient
      .from('family_invitations')
      .select(`
        *,
        family_accounts(name)
      `)
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      throw new Error('Invitation not found')
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is not pending')
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired')
    }

    // Create invitation link
    const inviteLink = `${appUrl || 'http://localhost:3000'}/family/accept?code=${invitation.id}`

    // Get inviter's email
    const { data: { user } } = await supabaseClient.auth.getUser(invitedBy)
    
    // Email content
    const emailSubject = `Приглашение в семейный бюджет: ${invitation.family_accounts?.name || 'Семейный аккаунт'}`
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Приглашение в семейный бюджет</h2>
        <p>Вас пригласили присоединиться к семейному бюджету "${invitation.family_accounts?.name || 'Семейный аккаунт'}".</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">Ссылка для принятия приглашения:</p>
          <a href="${inviteLink}" style="display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
            Принять приглашение
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Срок действия приглашения: ${new Date(invitation.expires_at).toLocaleDateString('ru-RU')}
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Если вы не запрашивали это приглашение, проигнорируйте это письмо.
        </p>
      </div>
    `

    // Send email using Supabase's email service
    // Note: You need to configure email in Supabase Dashboard
    const { error: emailError } = await supabaseClient.auth.admin.sendRawEmail({
      to: invitation.invited_email,
      subject: emailSubject,
      html: emailBody,
    })

    if (emailError) {
      console.error('Email send error:', emailError)
      // Don't throw error - invitation is created, email delivery is separate
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation created',
        inviteLink 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
