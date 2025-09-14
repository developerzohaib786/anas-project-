// Browser console test for video generation
// Run this in your browser console on the video generation page

async function testVideoGeneration() {
  console.log('🧪 Testing video generation function...');
  
  // Sample image data (replace with real image)
  const testImageData = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
  
  try {
    // Get auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ No auth session found');
      return;
    }
    
    console.log('✅ Auth session found');
    
    // Test video generation
    const response = await fetch('https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/generate-video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: testImageData,
        movement_description: "smooth camera pan from left to right with gentle zoom",
        sfx_description: "ambient nature sounds",
        video_size: "horizontal",
        prompt: "Test video generation from console"
      })
    });
    
    console.log('📡 Response status:', response.status);
    
    const result = await response.json();
    console.log('📊 Response data:', result);
    
    // If we got a generation ID, test status checking
    if (result.generationId) {
      console.log('🔍 Testing status check for ID:', result.generationId);
      
      const statusResponse = await fetch(`https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/generate-video?jobId=${result.generationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const statusResult = await statusResponse.json();
      console.log('📊 Status result:', statusResult);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testVideoGeneration();