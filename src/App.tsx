import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { CoachPage } from './pages/CoachPage';
import { DashboardPage } from './pages/DashboardPage';
import { LogPage } from './pages/LogPage';
import { CheckInPage } from './pages/CheckInPage';
import { NutritionPage } from './pages/NutritionPage';
import { BodyCompPage } from './pages/BodyCompPage';
import { PerformancePage } from './pages/PerformancePage';
import { BloodworkPage } from './pages/BloodworkPage';
import { ProjectionsPage } from './pages/ProjectionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingPage } from './pages/OnboardingPage';

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <CoachPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'log', element: <LogPage /> },
      { path: 'log/check-in', element: <CheckInPage /> },
      { path: 'log/nutrition', element: <NutritionPage /> },
      { path: 'log/body-comp', element: <BodyCompPage /> },
      { path: 'log/performance', element: <PerformancePage /> },
      { path: 'log/bloodwork', element: <BloodworkPage /> },
      { path: 'projections', element: <ProjectionsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '/onboarding', element: <OnboardingPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
