import { Navigate } from 'react-router';

export default function Index() {
  // Root route redirects to home (authentication is handled in root.tsx)
  return <Navigate to="/home" replace />;
}
