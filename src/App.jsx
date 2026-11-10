import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BrandSection from './components/BrandSection';
import ChatFab from './components/ChatFab';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import About from './pages/About';
import Mission from './pages/Mission';
import Values from './pages/Values';
import FarmLife from './pages/FarmLife';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import SignIn from './pages/SignIn';
import Images from './pages/Images';
import Portal from './pages/Portal';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/about.html" element={<About />} />
        <Route path="/mission" element={<Mission />} />
        <Route path="/mission.html" element={<Mission />} />
        <Route path="/values" element={<Values />} />
        <Route path="/values.html" element={<Values />} />
        <Route path="/farmlife" element={<FarmLife />} />
        <Route path="/farmlife.html" element={<FarmLife />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog.html" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/contact.html" element={<Contact />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signin.html" element={<SignIn />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/images" element={<Images />} />
        <Route path="/images.html" element={<Images />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BrandSection />
      <ChatFab />
    </>
  );
}

