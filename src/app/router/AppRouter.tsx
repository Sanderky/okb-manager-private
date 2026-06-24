import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import { PasswordRecoveryListener } from './PasswordRecoveryListener';
import { ResetPasswordPage } from '@/pages/reset-password';
import { EmployeeShowPage } from '@/pages/employee-show';
import { EmployeeEditPage } from '@/pages/employee-edit';
import { EmployeeCreatePage } from '@/pages/employee-create';
import { ConstructionsListPage } from '@/pages/constructions-list';
import { ConstructionShowPage } from '@/pages/construction-show';
import { ConstructionEditPage } from '@/pages/construction-edit';
import { ConstructionCreatePage } from '@/pages/construction-create';
import { LodgingsPage } from '@/pages/lodgings';
import { SchedulePage } from '@/pages/schedule';
import { VacationsPage } from '@/pages/vacations';
import { WorkLogsPage } from '@/pages/work-logs';
import { PageNotFound } from '@/pages/page-not-found';
import { CalendarPage } from '@/pages/calendar';
import { EmployeesListPage } from '@/pages/employees-list';
import { LoginPage } from '@/pages/login';
import { DashboardLayout, PublicLayout } from '@/widgets/layouts';
import type { User } from '@/entities/auth';
import { Home } from '@/pages/home';

export const AppRouter = ({ user }: { user: User | null }) => (
  <Router>
    <PasswordRecoveryListener />
    <Routes>
      <Route element={<PublicRoute user={user} />}>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>
      <Route element={<PrivateRoute user={user} />}>
        <Route element={<PublicLayout />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate replace to="/home" />} />
          <Route path="home" element={<Home />} />
          <Route path="employees" element={<EmployeesListPage />} />
          <Route path="employees/:employeeId" element={<EmployeeShowPage />} />
          <Route
            path="employees/:employeeId/edit"
            element={<EmployeeEditPage />}
          />
          <Route path="employees/create" element={<EmployeeCreatePage />} />
          <Route path="constructions" element={<ConstructionsListPage />} />
          <Route
            path="constructions/:constructionId"
            element={<ConstructionShowPage />}
          />
          <Route
            path="constructions/:constructionId/edit"
            element={<ConstructionEditPage />}
          />
          <Route
            path="constructions/create"
            element={<ConstructionCreatePage />}
          />
          <Route path="lodgings" element={<LodgingsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="vacations" element={<VacationsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="hours" element={<WorkLogsPage />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Route>
    </Routes>
  </Router>
);
