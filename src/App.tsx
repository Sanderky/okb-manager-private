import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Login from './pages/Login/Login';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routing/PrivateRoute';
import EmployeeShow from './pages/Dashboard/Employees/EmployeeShow';
import ConstructionsList from './pages/Dashboard/Constructions/ConstructionsList';
import NotificationsProvider from './hooks/useNotifications/NotificationsProvider';
import DialogsProvider from './hooks/useDialogs/DialogsProvider';
import ConstructionCreate from './pages/Dashboard/Constructions/ConstructionCreate';
import ConstructionShow from './pages/Dashboard/Constructions/ConstructionShow';
import EmployeeList from './pages/Dashboard/Employees/EmployeeList';
import EmployeeEdit from './pages/Dashboard/Employees/EmployeeEdit';
import EmployeeCreate from './pages/Dashboard/Employees/EmployeeCreate';
import ConstructionEdit from './pages/Dashboard/Constructions/ConstructionEdit';
import Home from './pages/Dashboard/Home/Home';
import VacationCalendar from './pages/Dashboard/Calendar/Calendar';
import Hours from './pages/Dashboard/Hours/Hours';
import Schedule from './pages/Dashboard/Schedule/Schedule';
import useEmployeesAlert from './hooks/useEmployeeAlert';

// import AppTheme from './theme/AppTheme';
// import {
//   dataGridCustomizations,
//   datePickersCustomizations,
//   sidebarCustomizations,
//   formInputCustomizations,
// } from './theme/customizations';

// const themeComponents = {
//   ...dataGridCustomizations,
//   ...datePickersCustomizations,
//   ...sidebarCustomizations,
//   ...formInputCustomizations,
// };

export default function App() {

  useEmployeesAlert()

  return (
    <AuthProvider>
      {/* <AppTheme {...props} themeComponents={themeComponents}> */}
      <CssBaseline enableColorScheme />
      <NotificationsProvider>
        <DialogsProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<PrivateRoute />}>
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<Navigate replace to="/home" />} />
                    <Route path="home" element={<Home />} />
                    <Route path="employees" element={<EmployeeList />} />
                    <Route
                      path="employees/:employeeId"
                      element={<EmployeeShow />}
                    />
                    <Route
                      path="employees/:employeeId/edit"
                      element={<EmployeeEdit />}
                    />
                    <Route path="employees/create" element={<EmployeeCreate />} />
                    <Route path="constructions" element={<ConstructionsList />} />
                    <Route
                      path="constructions/:constructionId"
                      element={<ConstructionShow />}
                    />
                    <Route
                      path="constructions/:constructionId/edit"
                      element={<ConstructionEdit />}
                    />
                    <Route
                      path="constructions/create"
                      element={<ConstructionCreate />}
                    />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="calendar" element={<VacationCalendar />} />
                    <Route path="hours" element={<Hours />} />
                  </Route>
                </Route>
              </Routes>
            </Router>
        </DialogsProvider>
      </NotificationsProvider>
      {/* </AppTheme> */}
    </AuthProvider>
  );
}
