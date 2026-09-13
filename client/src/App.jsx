import './App.css'

import { useEffect } from 'react'

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// ============================================================
// COMPONENTS
// ============================================================

import Navbar from './components/Navbar.jsx'
import AuthStateTest from './components/AuthStateTest.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import VaultHome from './components/VaultHome.jsx'

// ============================================================
// PAGES
// ============================================================

import LandingPage from './pages/LandingPage.jsx'
import Memories from './pages/Memories.jsx'
import Videos from './pages/Videos.jsx'
import Photos from './pages/Photos.jsx'
import AdminAccessRequests from './pages/AdminAccessRequests.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

// ============================================================
// AUTH
// ============================================================

import { useAuth } from './contexts/AuthContext.jsx'

// ============================================================
// SCROLL TO TOP
// ============================================================

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [pathname])

  return null
}

// ============================================================
// FULL PAGE EMAIL MOTION
//
// Only logged-in user's email will be displayed.
// ============================================================

function FloatingEmail() {
  const { user } = useAuth()

  if (!user?.email) {
    return null
  }

  return (
    <div className="floating-email-layer">
      <div className="floating-email floating-email-one">
        {user.email}
      </div>
    </div>
  )
}

// ============================================================
// APP CONTENT
// ============================================================

function AppContent() {
  const { user } = useAuth()
  const location = useLocation()

  // ==========================================================
  // LANDING + LOGIN PAGE
  //
  // Navbar will NOT appear on:
  //
  // /
  // /login
  //
  // Navbar starts after login.
  // ==========================================================

  const isLandingPage =
    location.pathname === '/'

  const isLoginPage =
    location.pathname === '/login'

  const showNavbar =
    user &&
    !isLandingPage &&
    !isLoginPage

  return (
    <>
      {/* ======================================================
          SCROLL TO TOP
      ====================================================== */}

      <ScrollToTop />

      {/* ======================================================
          NAVBAR
          
          Only visible after login.
      ====================================================== */}

      {showNavbar && <Navbar />}

      {/* ======================================================
          FULL PAGE MOVING EMAIL
          
          Only visible when logged in.
      ====================================================== */}

      {user && <FloatingEmail />}

      {/* ======================================================
          ROUTES
      ====================================================== */}

      <Routes>

        {/* ====================================================
            LANDING PAGE
            First screen for every visitor
        ==================================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* ====================================================
            LOGIN PAGE
            Google Login
        ==================================================== */}

        <Route
          path="/login"
          element={<AuthStateTest />}
        />

        {/* ====================================================
            HOME
            Logged-in users only
        ==================================================== */}

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <VaultHome />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            MEMORIES
            Logged-in users only
        ==================================================== */}

        <Route
          path="/memories"
          element={
            <ProtectedRoute>
              <Memories />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            VIDEOS
            Logged-in users only
        ==================================================== */}

        <Route
          path="/videos"
          element={
            <ProtectedRoute>
              <Videos />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            PHOTOS
            Logged-in users only
        ==================================================== */}

        <Route
          path="/photos"
          element={
            <ProtectedRoute>
              <Photos />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            ADMIN DASHBOARD
            ADMIN ONLY
        ==================================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            ADMIN ACCESS REQUESTS
            ADMIN ONLY
        ==================================================== */}

        <Route
          path="/admin/access-requests"
          element={
            <ProtectedRoute adminOnly>
              <AdminAccessRequests />
            </ProtectedRoute>
          }
        />

      </Routes>
    </>
  )
}

// ============================================================
// MAIN APP
// ============================================================

function App() {
  return (
    <BrowserRouter>

      <AppContent />

      {/* ======================================================
          GLOBAL TOAST
          
          Login success:
          "Login successful! ❤️"
          
          Position:
          Top center
          
          Duration:
          1.5 seconds
      ====================================================== */}

      <ToastContainer
        position="top-center"
        autoClose={1500}
        newestOnTop
        pauseOnHover
        closeOnClick
        draggable
        theme="light"
        hideProgressBar={false}
      />

    </BrowserRouter>
  )
}

export default App