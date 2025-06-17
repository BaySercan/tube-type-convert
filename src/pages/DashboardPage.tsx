import { useAuth } from '@/contexts/AuthContext'; // Make sure to import useAuth

const DashboardPageWithAuth = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{user?.email || 'Authenticated User'}</strong>!</p>
      <p>This is a protected area of the application.</p>
      <p>Only users who have successfully signed in can view this page.</p>
      {/* You can add more dashboard-specific components and features here */}
    </div>
  );
};

export default DashboardPageWithAuth; // Exporting the refined component
