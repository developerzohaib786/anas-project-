// Test status checking functionality
// Run this after getting a generationId from video generation

async function testStatusCheck(jobId) {
  console.log('🔍 Testing status check for job:', jobId);
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ No auth session');
      return;
    }
    
    const response = await fetch(`https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/generate-video?jobId=${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Status response:', response.status);
    const result = await response.json();
    console.log('📊 Status data:', result);
    
    return result;
  } catch (error) {
    console.error('💥 Status check failed:', error);
  }
}

// Example usage:
// testStatusCheck('your-job-id-here');