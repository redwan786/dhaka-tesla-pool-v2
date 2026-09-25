import { ProtectedRoute } from '../../components/auth/protected-route';
import { PassengerDashboard } from '../../components/passenger/passenger-dashboard';

export default function PassengerPage() {
  return <ProtectedRoute allowedRoles={['PASSENGER']}><PassengerDashboard /></ProtectedRoute>;
}
