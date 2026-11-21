import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import GlobalBottomNav from './components/GlobalBottomNav';

import Home from './pages/Home';
import About from './pages/About';
import Mission from './pages/Mission';
import Values from './pages/Values';
import Vision from './pages/Vision';
import FarmLife from './pages/FarmLife';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import Images from './pages/Images';
import Planning from './pages/Planning';

// Enterprise Category Portals & Systems (each loads only when opened, so the website stays light)
const MemberPortal = React.lazy(() => import('./pages/portals/MemberPortal'));
const AdminPortal = React.lazy(() => import('./pages/portals/AdminPortal'));
const BoardPortal = React.lazy(() => import('./pages/portals/BoardPortal'));
const SecretaryPortal = React.lazy(() => import('./pages/portals/SecretaryPortal'));
const AccountantPortal = React.lazy(() => import('./pages/portals/AccountantPortal'));
const FarmPortal = React.lazy(() => import('./pages/portals/FarmPortal'));
import AccessDenied from './components/AccessDenied';
import { getSession } from './services/api';

function RequireAuth({ allowedRoles, children }) {
  const session = getSession();
  if (!session) {
    return <Navigate to="/signin" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    const fallback = session.role === 'ADMIN' ? '/admin' : '/member';
    return <AccessDenied message="You have no access to this field." backPath={fallback} />;
  }
  return children;
}

export default function App() {
  const location = useLocation();

  // Determine if currently in an enterprise dashboard/portal route
  const portalPaths = [
    '/admin',
    '/sacco',
    '/farm-system',
    '/cattle',
    '/animals',
    '/milk',
    '/health',
    '/breeding',
    '/feed',
    '/accounting',
    '/portal',
    '/member',
    '/board',
    '/secretary',
    '/accountant',
    '/farm',
    '/signup',
    '/reset-password'
  ];

  const isPortalRoute = portalPaths.some(path =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  return (
    <>
      <ScrollToTop />

      {/* Render Public Navbar ONLY on marketing/public pages */}
      {!isPortalRoute && <Navbar />}

      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading…</div>}>
      <Routes>
        {/* Public Website Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/about.html" element={<About />} />
        <Route path="/mission" element={<Mission />} />
        <Route path="/mission.html" element={<Mission />} />
        <Route path="/values" element={<Values />} />
        <Route path="/values.html" element={<Values />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/vision.html" element={<Vision />} />
        <Route path="/farmlife" element={<FarmLife />} />
        <Route path="/farmlife.html" element={<FarmLife />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog.html" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/contact.html" element={<Contact />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signin.html" element={<SignIn />} />
        <Route path="/signup" element={<Navigate to="/signup/details" replace />} />
        <Route path="/signup/:step" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/images" element={<Images />} />
        <Route path="/images.html" element={<Images />} />
        <Route path="/planning" element={<Planning />} />

        {/* 6 Category Portals & Dedicated JBS Farm Systems */}
        <Route path="/admin" element={<RequireAuth allowedRoles={['ADMIN']}><AdminPortal /></RequireAuth>} />
        <Route path="/sacco" element={<RequireAuth allowedRoles={['ADMIN']}><AdminPortal /></RequireAuth>} />
        <Route path="/farm-system" element={<RequireAuth allowedRoles={['ADMIN', 'FARM_WORKER', 'BOARD_MEMBER', 'ACCOUNTANT', 'SECRETARY']}><FarmPortal /></RequireAuth>} />
        <Route path="/cattle" element={<RequireAuth allowedRoles={['ADMIN', 'FARM_WORKER', 'BOARD_MEMBER', 'ACCOUNTANT', 'SECRETARY']}><FarmPortal /></RequireAuth>} />
        <Route path="/animals" element={<RequireAuth allowedRoles={['ADMIN', 'FARM_WORKER', 'BOARD_MEMBER', 'ACCOUNTANT', 'SECRETARY']}><FarmPortal /></RequireAuth>} />
        <Route path="/milk" element={<RequireAuth allowedRoles={['ADMIN', 'FARM_WORKER', 'BOARD_MEMBER', 'ACCOUNTANT', 'SECRETARY']}><FarmPortal /></RequireAuth>} />
        <Route path="/health" element={<RequireAuth allowedRoles={['ADMIN', 'FARM_WORKER', 'BOARD_MEMBER', 'ACCOUNTANT', 'SECRETARY']}><FarmPortal /></RequireAuth>} />
        <Route path="/breeding" element={<RequireAuth allowedRoles={['ADMIN', 'FARM_WORKER', 'BOARD_MEMBER', 'ACCOUNTANT', 'SECRETARY']}><FarmPortal /></RequireAuth>} />
        <Route path="/feed" element={<RequireAuth allowedRoles={['ADMIN', 'FARM_WORKER', 'BOARD_MEMBER', 'ACCOUNTANT', 'SECRETARY']}><FarmPortal /></RequireAuth>} />
        <Route path="/portal" element={<RequireAuth allowedRoles={['MEMBER', 'ADMIN', 'BOARD_MEMBER', 'SECRETARY', 'ACCOUNTANT', 'FARM_WORKER']}><MemberPortal /></RequireAuth>} />
        <Route path="/member" element={<RequireAuth allowedRoles={['MEMBER', 'ADMIN', 'BOARD_MEMBER', 'SECRETARY', 'ACCOUNTANT', 'FARM_WORKER']}><MemberPortal /></RequireAuth>} />
        <Route path="/board" element={<RequireAuth allowedRoles={['BOARD_MEMBER', 'ADMIN']}><BoardPortal /></RequireAuth>} />
        <Route path="/secretary" element={<RequireAuth allowedRoles={['SECRETARY', 'ADMIN']}><SecretaryPortal /></RequireAuth>} />
        <Route path="/accountant" element={<RequireAuth allowedRoles={['ACCOUNTANT', 'ADMIN']}><AccountantPortal /></RequireAuth>} />
        <Route path="/accounting" element={<RequireAuth allowedRoles={['ACCOUNTANT', 'ADMIN']}><AccountantPortal /></RequireAuth>} />
        <Route path="/farm" element={<RequireAuth allowedRoles={['ADMIN', 'FARM_WORKER', 'BOARD_MEMBER', 'ACCOUNTANT', 'SECRETARY']}><FarmPortal /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </React.Suspense>

      {/* Universal Bottom Navigation Bar for the Whole Website */}
      {!location.pathname.startsWith('/signup') && !location.pathname.startsWith('/reset-password') && <GlobalBottomNav />}
    </>
  );
}
