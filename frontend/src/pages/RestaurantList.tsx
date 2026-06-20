import { useEffect, useState } from 'react'; // Removed 'React'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, Clock } from 'lucide-react'; // Removed 'Filter'
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Badge from '../components/Badge';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  address: string;
  image: string;
}

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:3001/api/restaurants')
      .then(res => setRestaurants(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filters = ['All', 'Top Rated', 'Fast Delivery', 'Pure Veg'];

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Restaurants Near You</h1>
          <p className="text-gray-500">Discover top places to eat.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                filter === f 
                ? 'bg-gray-900 text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-gray-100">
                <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                <div className="bg-gray-200 h-6 w-3/4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
              </div>
            ))
          ) : (
            restaurants.map((restaurant, i) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
              >
                <Card className="cursor-pointer group h-full">
                  <div className="relative overflow-hidden h-56">
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge variant="warning" className="shadow-sm">Featured</Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold text-sm">
                        <Star size={14} fill="currentColor" /> {restaurant.rating}
                      </div>
                    </div>
                    <p className="text-gray-500 mb-4">{restaurant.cuisine} • $$</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-1.5"><Clock size={16} className="text-primary"/> 30-40 min</span>
                      <span className="flex items-center gap-1.5"><MapPin size={16} className="text-primary"/> {restaurant.address}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RestaurantList;