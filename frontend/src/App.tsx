import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './components/layout/LandingPage';
import { LoginPage, RegisterPage } from './components/auth/AuthPages';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { SheetsPage, SheetDetailPage } from './components/sheets/SheetPages';
import { MockTestsPage, MockTestPage, MockResultPage } from './components/mock/MockPages';
import { InterviewsPage, InterviewDetailPage } from './components/interviews/InterviewPages';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { ProfilePage } from './components/analytics/ProfilePage';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false } },
});

function Layout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/sheets" element={<Layout><SheetsPage /></Layout>} />
          <Route path="/sheets/:id" element={<Layout><SheetDetailPage /></Layout>} />
          <Route path="/mock" element={<Layout><MockTestsPage /></Layout>} />
          <Route path="/interviews" element={<Layout><InterviewsPage /></Layout>} />
          <Route path="/interviews/:id" element={<Layout><InterviewDetailPage /></Layout>} />
          <Route path="/analytics" element={<Layout><AnalyticsPage /></Layout>} />

          <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/mock/:id" element={<ProtectedRoute><Layout><MockTestPage /></Layout></ProtectedRoute>} />
          <Route path="/mock/result/:id" element={<ProtectedRoute><Layout><MockResultPage /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
