import { BrowserRouter, Routes, Route } from "react-router-dom";

// Módulos públicos
import LandingPage from "./pages/landing/LandingPage";
import AuthLayout from "./pages/auth/AuthLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Layout y Módulos internos
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ConductorPage from "./pages/Conductor/ConductorPage";
import VehiculosPage from "./pages/Vehiculos/VehiculosPage";
import ConductoresPage from "./pages/Conductores/ConductoresPage";
import DocumentosPage from "./pages/Documentos/DocumentosPage";
import FinanzasPage from "./pages/Finanzas/FinanzasPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas sueltas, sin el diseño del panel de control */}
        <Route path="/" element={<LandingPage />} />

        {/* Autenticación: AuthLayout gestiona la tarjeta split y el
            efecto revista al alternar entre login y registro */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Rutas protegidas (requieren sesión activa) */}
        <Route element={<ProtectedRoute />}>
          {/* Rutas envueltas en el DashboardLayout (con Sidebar y Topbar) */}
          <Route path="/app" element={<DashboardLayout />}>
            {/* Al entrar a /app se renderiza DashboardPage por defecto */}
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="conductor" element={<ConductorPage />} />
            <Route path="vehiculos" element={<VehiculosPage />} />
            <Route path="conductores" element={<ConductoresPage />} />
            <Route path="documentos" element={<DocumentosPage />} />
            <Route path="finanzas" element={<FinanzasPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}