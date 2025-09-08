import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ChatProvider } from '@/contexts/ChatContext'
import { BrandProvider } from '@/contexts/BrandContext'
import { TooltipProvider } from '@/components/ui/tooltip'

// Create a test-specific query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ChatProvider>
          <BrandProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </BrandProvider>
        </ChatProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock Supabase client for tests
export const mockSupabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      order: () => ({
        limit: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
  functions: {
    invoke: () => Promise.resolve({ data: { response: 'Mock response' }, error: null }),
  },
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  ...overrides,
})

export const createMockBrandProfile = (overrides = {}) => ({
  id: 'test-brand-id',
  user_id: 'test-user-id',
  brand_name: 'Test Hotel',
  description: 'A luxury test hotel',
  brand_tone: 'Luxurious, Friendly',
  brand_voice: 'Warm and welcoming',
  content_dos: 'Ocean views, Premium amenities',
  content_donts: 'Crowded spaces, Generic feel',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockChatSession = (overrides = {}) => ({
  id: 'test-session-id',
  title: 'Test Session',
  createdAt: new Date(),
  updatedAt: new Date(),
  isCompleted: false,
  generatedImage: undefined,
  currentPrompt: undefined,
  ...overrides,
})

// Wait for async operations in tests
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
