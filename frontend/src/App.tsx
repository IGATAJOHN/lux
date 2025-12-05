import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/routes/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Rooms from "./pages/Rooms";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import FaceVerification from "./pages/FaceVerification";
import StaffManagement from "./pages/StaffManagement";
import RoomManagement from "./pages/RoomManagement";
import CredentialsPage from "./pages/CredentialsPage";
import GuestVerify from "./pages/GuestVerify";
import PaymentCallback from "./pages/PaymentCallback";
import NotFound from "./pages/NotFound";
import VoiceChat from "./pages/VoiceChat";
import ChatWidget from "./components/chat/ChatWidget";
import StaffDashboard from "./pages/StaffDashboard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ChatWidget />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/guest-verify/:token" element={<GuestVerify />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/staff" element={
                <ProtectedRoute requireAdmin>
                  <StaffManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/rooms" element={
                <ProtectedRoute requireAdmin>
                  <RoomManagement />
                </ProtectedRoute>
              } />
              <Route path="/credentials" element={
                <ProtectedRoute>
                  <CredentialsPage />
                </ProtectedRoute>
              } />
              <Route path="/face-verification" element={<FaceVerification />} />
              <Route path="/voice-chat" element={<VoiceChat />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
