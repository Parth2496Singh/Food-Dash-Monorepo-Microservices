import { motion } from 'framer-motion';
import { Search, MapPin, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const LandingPage = () => {
  const categories = [
    { name: 'Pizza', image: '🍕', color: 'bg-orange-100' },
    { name: 'Burgers', image: '🍔', color: 'bg-yellow-100' },
    { name: 'Sushi', image: '🍣', color: 'bg-red-100' },
    { name: 'Healthy', image: '🥗', color: 'bg-green-100' },
    { name: 'Desserts', image: '🍩', color: 'bg-pink-100' },
    { name: 'Coffee', image: '☕', color: 'bg-blue-100' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl md:text-7xl font-black text-gray-900 tracking-tight mb-6"
          >
            Craving something <span className="text-primary">delicious?</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            Get the best food from top restaurants delivered to your doorstep in minutes.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="max-w-2xl mx-auto bg-white p-2 rounded-full shadow-lg flex items-center"
          >
            <div className="pl-4 text-gray-400">
              <MapPin size={24} />
            </div>
            <input 
              type="text" 
              placeholder="Enter your delivery address" 
              className="flex-1 py-3 px-4 outline-none text-gray-700 bg-transparent"
            />
            <Link to="/restaurants">
              <Button size="lg" className="rounded-full px-8">Find Food</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-bold">Eat what makes you happy</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, idx) => (
              <motion.div 
                key={cat.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={`${cat.color} rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer shadow-sm`}
              >
                <span className="text-5xl mb-4">{cat.image}</span>
                <span className="font-semibold text-gray-800">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <motion.div whileHover={{ y: -10 }} className="bg-white p-8 rounded-3xl shadow-sm">
              <div className="w-16 h-16 bg-orange-100 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Super Fast Delivery</h3>
              <p className="text-gray-600">We deliver your food in under 30 minutes, piping hot and fresh.</p>
            </motion.div>
            <motion.div whileHover={{ y: -10 }} className="bg-white p-8 rounded-3xl shadow-sm">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Top Rated Chefs</h3>
              <p className="text-gray-600">Partnering with the finest restaurants and chefs in your city.</p>
            </motion.div>
            <motion.div whileHover={{ y: -10 }} className="bg-white p-8 rounded-3xl shadow-sm">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Endless Choices</h3>
              <p className="text-gray-600">Thousands of menus to choose from. Discover new flavors every day.</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
