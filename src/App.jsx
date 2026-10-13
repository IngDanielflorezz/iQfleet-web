import { BrowserRouter, Routes, Route } from "react-router-dom";

// Módulos públicos
import LandingPage from "./modulos/landing/LandingPage";
import Login from "./modulos/auth/Login"; 

// Layout y Módulos internos
import DashboardLayout from "./componentes/layout/DashboardLayout";
import DashboardPage from "./modulos/Dashboard/DashboardPage";
import VehiculosPage from "./modulos/Vehiculos/VehiculosPage";
import ConductoresPage from "./modulos/Conductores/ConductoresPage";
import DocumentosPage from "./modulos/Documentos/DocumentosPage";
import FinanzasPage from "./modulos/Finanzas/FinanzasPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas sueltas, sin el diseño del panel de control */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rutas envueltas en el DashboardLayout (con Sidebar y Topbar) */}
        <Route path="/app" element={<DashboardLayout />}>
          {/* Al entrar a /app se renderiza DashboardPage por defecto */}
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vehiculos" element={<VehiculosPage />} />
          <Route path="conductores" element={<ConductoresPage />} />
          <Route path="documentos" element={<DocumentosPage />} />
          <Route path="finanzas" element={<FinanzasPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}