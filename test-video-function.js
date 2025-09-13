import { createClient } from '@supabase/supabase-js'

// Test the Supabase client configuration
const supabaseUrl = 'https://pbndydilyqxqmcxwadvy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibmR5ZGlseXF4cW1jeHdhZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MzAxODAsImV4cCI6MjA0MDMwNjE4MH0.y4vgioNV8Ou8ErDJ_vbj7QR2mGmJwy5BdnQF_bfvKug'

console.log('Testing generate-video function...')

const supabase = createClient(supabaseUrl, supabaseKey)

// Test video function invocation
async function testVideoFunction() {
  try {
    console.log('Attempting to call generate-video function...')
    
    // Create a simple test image (base64 encoded 1x1 pixel PNG)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    const { data, error } = await supabase.functions.invoke('generate-video', {
      body: {
        image: testImage,
        movement_description: 'gentle camera pan from left to right',
        sfx_description: 'ambient nature sounds',
        video_size: 'horizontal',
        prompt: 'test video generation'
      }
    })

    if (error) {
      console.error('Function call error:', error)
      if (error.message?.includes('404')) {
        console.log('❌ 404 Error - Function is not deployed or URL is incorrect')
      } else if (error.message?.includes('503')) {
        console.log('❌ 503 Error - Function is deployed but not accessible')
      }
    } else {
      console.log('✅ Function call successful:', data)
    }

  } catch (err) {
    console.error('Network or other error:', err)
  }
}

testVideoFunction()