'use client';

import { useState } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

export default function TestSentryPage() {
  const [errorTriggered, setErrorTriggered] = useState(false);

  const triggerError = () => {
    try {
      // Intentionally throw an error
      throw new Error('🧪 Test error for Sentry - This is intentional!');
    } catch (error) {
      logger.exception(error, { 
        where: 'test-sentry.page',
        testType: 'manual',
        timestamp: new Date().toISOString()
      });
      setErrorTriggered(true);
    }
  };

  const triggerUncaughtError = () => {
    // This will be caught by ErrorBoundary and sent to Sentry
    throw new Error('🚨 Uncaught test error for Sentry!');
  };

  const triggerAsyncError = async () => {
    try {
      // Simulate failed API call
      throw new Error('❌ Async API test error for Sentry');
    } catch (error) {
      logger.exception(error, {
        where: 'test-sentry.asyncError',
        apiEndpoint: '/test-endpoint',
        method: 'GET'
      });
      setErrorTriggered(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🧪 Sentry Error Testing
          </h1>

          <div className="space-y-4 mb-8">
            <p className="text-gray-600">
              Click any button below to trigger a test error. Check your Sentry dashboard at:
            </p>
            <a 
              href="https://sentry.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-blue-600 hover:text-blue-800 underline"
            >
              https://sentry.io
            </a>
            <p className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-3">
              ⚠️ Note: Sentry only works in production builds. Run <code className="bg-gray-100 px-2 py-1 rounded">npm run build && npm start</code> to test.
            </p>
          </div>

          <div className="space-y-4">
            {/* Test 1: Caught error */}
            <button
              onClick={triggerError}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              🎯 Trigger Caught Error
            </button>

            {/* Test 2: Uncaught error (will crash component) */}
            <button
              onClick={triggerUncaughtError}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              💥 Trigger Uncaught Error (Crashes Component)
            </button>

            {/* Test 3: Async error */}
            <button
              onClick={triggerAsyncError}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              ⚡ Trigger Async Error
            </button>
          </div>

          {errorTriggered && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ Error logged! Check your Sentry dashboard.
              </p>
              <p className="text-sm text-green-600 mt-2">
                In production mode, this error was sent to Sentry.
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              What to check in Sentry:
            </h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Error message and stack trace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Context information (where, testType, timestamp)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Browser information and user agent</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Breadcrumbs showing user actions before error</span>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-block text-gray-600 hover:text-gray-800 underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
