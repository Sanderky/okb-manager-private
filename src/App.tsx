import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Login from './pages/Login/Login';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routing/PrivateRoute';
import ConstructionsList from './pages/Dashboard/Constructions/ConstructionsList';
import NotificationsProvider from './hooks/useNotifications/NotificationsProvider';
import DialogsProvider from './hooks/useDialogs/DialogsProvider';
import ConstructionCreate from './pages/Dashboard/Constructions/ConstructionCreate';
import ConstructionShow from './pages/Dashboard/Constructions/ConstructionShow';
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
                  <Route path="/" element={<DashboardLayout/>} >
                    <Route path="constructions" element={<ConstructionsList/>}/>
                      <Route path="constructions/new" element={<ConstructionCreate/>}/>
                      <Route path="constructions/:constructionId" element={<ConstructionShow/>}/>
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
