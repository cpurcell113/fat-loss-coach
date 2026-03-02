import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { TrainPage } from './pages/TrainPage';
import { FuelPage } from './pages/FuelPage';
import { BodyPage } from './pages/BodyPage';
import { CoachPage } from './pages/CoachPage';
import { CheckInPage } from './pages/CheckInPage';
import { BloodworkPage } from './pages/BloodworkPage';
import { ProjectionsPage } from './pages/ProjectionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingPage } from './pages/OnboardingPage';

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'train', element: <TrainPage /> },
      { path: 'fuel', element: <FuelPage /> },
      { path: 'body', element: <BodyPage /> },
      { path: 'coach', element: <CoachPage /> },
      { path: 'check-in', element: <CheckInPage /> },
      { path: 'bloodwork', element: <BloodworkPage /> },
      { path: 'projections', element: <ProjectionsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '/onboarding', element: <OnboardingPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
