import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import RestaurantList from './pages/RestaurantList';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderTracker from './pages/OrderTracker';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

const App = () => {
  return (
    <ThemeProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col relative">
            {/* Ambient Background Glow for Nebula theme */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px]"></div>
            </div>

            <Navbar />
            <main className="flex-grow z-10 relative">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/restaurants" element={<RestaurantList />} />
                <Route path="/restaurant/:id" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/order/:id" element={<OrderTracker />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Routes>
            </main>
            
            <footer className="glass-panel mt-auto z-10 py-12 rounded-t-3xl border-b-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-2xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">FOOD-DASH</h2>
                <p className="opacity-70">A polyglot microservices demonstration.</p>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </CartProvider>
    </ThemeProvider>
  );
};

export default App;
