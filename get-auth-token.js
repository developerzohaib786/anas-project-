// Run this in your browser console to get auth token
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    console.log('🔑 Your auth token:');
    console.log(session.access_token);
    console.log('\n📋 Copy this token for your curl test');
    return session.access_token;
  } else {
    console.log('❌ No auth session found - please log in first');
  }
}

getAuthToken();