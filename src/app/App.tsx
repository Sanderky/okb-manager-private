import { useAuth } from '@/entities/auth';
import { AppProviders } from './providers';
import { AppInitProvider } from './providers/AppInitProvider';
import { AppRouter } from './router/AppRouter';

const AppContent = () => {
  const { user } = useAuth();

  return (
    <AppInitProvider>
      <AppRouter user={user} />
    </AppInitProvider>
  );
};

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
