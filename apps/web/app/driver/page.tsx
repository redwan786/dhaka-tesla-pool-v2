import { ProtectedRoute } from '../../components/auth/protected-route';
import { DriverDashboard } from '../../components/driver/driver-dashboard';

export default function DriverPage() {
  return <ProtectedRoute allowedRoles={['DRIVER']}><DriverDashboard /></ProtectedRoute>;
}
