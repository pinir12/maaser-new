import { AuthProvider, useAuth } from './lib/auth-context';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1615716038854-58e352eee1db?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHNvZnQlMjBncmFkaWVudCUyMGJhY2tncm91bmQlMjBzYW5kJTIwcGFzdGVsJTIwZ3JlZW58ZW58MHx8fHwxNzc1Nzg0OTY2fDA&ixlib=rb-4.1.0&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1E3F32] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#181C1A] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
