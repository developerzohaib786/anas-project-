import React from 'react';

/**
 * Analytics and monitoring utilities
 * Provides basic event tracking and performance monitoring
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: Date;
  metadata?: Record<string, any>;
}

class Analytics {
  private isEnabled: boolean;
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.isEnabled = import.meta.env.PROD; // Only in production
    this.sessionId = this.generateSessionId();
    this.setupPerformanceMonitoring();
  }

  /**
   * Track user events
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.queue.push(event);
    this.logEvent(event);

    // In a real implementation, you'd send to your analytics service
    this.sendToAnalyticsService(event);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(name: string, value: number, unit: 'ms' | 'bytes' | 'count', metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      metadata,
    };

    this.logPerformance(metric);
    this.sendPerformanceMetric(metric);
  }

  /**
   * Track errors
   */
  trackError(error: Error | string, context?: string) {
    const errorData = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.track('error_occurred', errorData);
    console.error('[Analytics] Error tracked:', errorData);
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Track page views
   */
  trackPageView(path: string) {
    this.track('page_view', {
      path,
      referrer: document.referrer,
      timestamp: Date.now(),
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(element: string, action: string, properties?: Record<string, any>) {
    this.track('user_interaction', {
      element,
      action,
      ...properties,
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, properties?: Record<string, any>) {
    this.track('feature_used', {
      feature,
      ...properties,
    });
  }

  /**
   * Track API calls
   */
  trackAPICall(endpoint: string, method: string, statusCode: number, duration: number) {
    this.track('api_call', {
      endpoint,
      method,
      statusCode,
      duration,
      success: statusCode >= 200 && statusCode < 300,
    });

    this.trackPerformance(`api_${endpoint}_duration`, duration, 'ms', {
      method,
      statusCode,
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private logEvent(event: AnalyticsEvent) {
    console.log(`[Analytics] Event: ${event.name}`, event.properties);
  }

  private logPerformance(metric: PerformanceMetric) {
    console.log(`[Analytics] Performance: ${metric.name} = ${metric.value}${metric.unit}`, metric.metadata);
  }

  private async sendToAnalyticsService(event: AnalyticsEvent) {
    // In production, you would send to your analytics service
    // Examples: Google Analytics, Mixpanel, Amplitude, PostHog
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] Would send event:', event);
      return;
    }

    // Example implementation:
    try {
      // await fetch('/api/analytics/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });
    } catch (error) {
      console.error('[Analytics] Failed to send event:', error);
    }
  }

  private async sendPerformanceMetric(metric: PerformanceMetric) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Would send performance metric:', metric);
      return;
    }

    try {
      // await fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metric),
      // });
    } catch (error) {
      console.error('[Analytics] Failed to send performance metric:', error);
    }
  }

  private setupPerformanceMonitoring() {
    if (!this.isEnabled) return;

    // Monitor Core Web Vitals
    this.observePerformance();
    
    // Monitor long tasks
    this.observeLongTasks();
    
    // Monitor resource loading
    this.observeResourceTiming();
  }

  private observePerformance() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.trackPerformance('lcp', entry.startTime, 'ms');
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.trackPerformance('fid', (entry as any).processingStart - entry.startTime, 'ms');
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          this.trackPerformance('cls', (entry as any).value, 'count');
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private observeLongTasks() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.trackPerformance('long_task', entry.duration, 'ms', {
          startTime: entry.startTime,
        });
      }
    }).observe({ entryTypes: ['longtask'] });
  }

  private observeResourceTiming() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        this.trackPerformance('resource_load_time', resourceEntry.duration, 'ms', {
          resource: resourceEntry.name,
          type: resourceEntry.initiatorType,
          size: resourceEntry.transferSize,
        });
      }
    }).observe({ entryTypes: ['resource'] });
  }
}

// Create singleton instance
export const analytics = new Analytics();

/**
 * React hook for analytics
 */
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
  };
}

/**
 * Higher-order component for automatic page tracking
 */
export function withAnalytics<T extends object>(Component: React.ComponentType<T>) {
  return function AnalyticsWrapper(props: T) {
    const { trackPageView } = useAnalytics();
    
    React.useEffect(() => {
      trackPageView(window.location.pathname);
    }, [trackPageView]);

    return React.createElement(Component, props);
  };
}
