import { createClient } from '@supabase/supabase-js'

// Test the Supabase client configuration
const supabaseUrl = 'https://pbndydilyqxqmcxwadvy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibmR5ZGlseXF4cW1jeHdhZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MzAxODAsImV4cCI6MjA0MDMwNjE4MH0.y4vgioNV8Ou8ErDJ_vbj7QR2mGmJwy5BdnQF_bfvKug' // This should be from your env

console.log('Testing Supabase connection...')

const supabase = createClient(supabaseUrl, supabaseKey)

// Test function invocation
async function testFunction() {
  try {
    console.log('Attempting to call generate-image function...')
    
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt: 'test luxury hotel room with golden lighting',
        images: []
      }
    })

    if (error) {
      console.error('Function call error:', error)
      if (error.message?.includes('503')) {
        console.log('❌ 503 Error - Function is not deployed or not accessible')
        console.log('This confirms the function needs to be deployed properly.')
      }
    } else {
      console.log('✅ Function call successful:', data)
    }

  } catch (err) {
    console.error('Network or other error:', err)
  }
}

testFunction()
