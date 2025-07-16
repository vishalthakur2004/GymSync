import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Landing/Navbar";
import Hero from "./components/Landing/Hero";
import Features from "./components/Landing/Features";
import Pricing from "./components/Landing/Pricing";
import Testimonials from "./components/Landing/Testimonials";
import Footer from "./components/Landing/Footer";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;