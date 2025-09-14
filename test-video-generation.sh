#!/bin/bash

# Test script for video generation function
# Replace YOUR_AUTH_TOKEN with the token from browser console

SUPABASE_URL="https://pbndydilyqxqmcxwadvy.supabase.co"
AUTH_TOKEN="YOUR_AUTH_TOKEN_HERE"

# Test image (base64 encoded sample - you can replace with your own)
IMAGE_DATA="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

echo "🧪 Testing Video Generation Function..."
echo "📡 Supabase URL: $SUPABASE_URL"
echo "🔑 Auth Token: ${AUTH_TOKEN:0:20}..."
echo ""

# Test POST request (video generation)
echo "📡 Testing video generation..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/functions/v1/generate-video" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "'$IMAGE_DATA'",
    "movement_description": "smooth camera pan from left to right with gentle zoom",
    "sfx_description": "ambient nature sounds",
    "video_size": "horizontal",
    "prompt": "Test video generation"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

echo "📊 HTTP Status: $HTTP_CODE"
echo "📋 Response Body:"
echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"

# Extract generation ID if present
GENERATION_ID=$(echo "$RESPONSE_BODY" | jq -r '.generationId // empty' 2>/dev/null)

if [ ! -z "$GENERATION_ID" ] && [ "$GENERATION_ID" != "null" ]; then
    echo ""
    echo "✅ Got generation ID: $GENERATION_ID"
    echo "📊 Testing status check..."
    
    sleep 2
    
    curl -s -X GET "$SUPABASE_URL/functions/v1/generate-video?jobId=$GENERATION_ID" \
      -H "Authorization: Bearer $AUTH_TOKEN" | jq . 2>/dev/null || echo "Status check response received"
else
    echo ""
    echo "ℹ️ No generation ID found - this might be expected for fallback responses"
fi

echo ""
echo "✅ Test completed!"