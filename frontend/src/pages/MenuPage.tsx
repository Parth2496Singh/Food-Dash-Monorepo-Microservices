import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Card from '../components/Card';

interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

const MenuPage = () => {
  const { id } = useParams<{ id: string }>();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { items, addToCart, removeFromCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, restRes] = await Promise.all([
          axios.get(`http://localhost:3002/api/menu?restaurantId=${id}`),
          axios.get(`http://localhost:3001/api/restaurants/${id}`)
        ]);
        setMenu(menuRes.data);
        setRestaurant(restRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const categories = [...new Set(menu.map(item => item.category))];

  if (loading) {
    return <div className="page-container text-center py-20 animate-pulse text-2xl font-bold text-gray-300">Loading Menu...</div>;
  }

  return (
    <div>
      {/* Restaurant Header */}
      {restaurant && (
        <div className="relative h-72 md:h-96 w-full">
          <img src={restaurant.image} className="w-full h-full object-cover" alt={restaurant.name} />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 text-white">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-black mb-2">{restaurant.name}</h1>
              <p className="text-lg opacity-90">{restaurant.cuisine} • {restaurant.address}</p>
            </div>
          </div>
        </div>
      )}

      <div className="page-container flex flex-col md:flex-row gap-8">
        {/* Sticky Categories */}
        <div className="md:w-1/4">
          <div className="sticky top-28 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4">Categories</h3>
            <ul className="space-y-3">
              {categories.map(cat => (
                <li key={cat}>
                  <a href={`#category-${cat}`} className="text-gray-600 hover:text-primary transition-colors font-medium">
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Menu Items */}
        <div className="md:w-3/4">
          {categories.map((category) => (
            <motion.div 
              key={category} 
              id={`category-${category}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="mb-12 scroll-mt-28"
            >
              <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2 border-gray-100">{category}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {menu.filter(m => m.category === category).map(item => {
                  const cartItem = items.find(i => i.menuId === item.id);
                  const qty = cartItem ? cartItem.quantity : 0;

                  return (
                    <Card key={item.id} className="flex overflow-hidden">
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
                          <span className="font-bold text-gray-900">${item.price.toFixed(2)}</span>
                        </div>
                        <div className="mt-4">
                          {qty > 0 ? (
                            <div className="flex items-center gap-4 bg-gray-50 inline-flex rounded-full p-1 border border-gray-200">
                              <button 
                                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                  if (qty === 1) removeFromCart(item.id);
                                  else addToCart({ menuId: item.id, name: item.name, price: item.price, quantity: -1, restaurantId: id! });
                                }}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-bold w-4 text-center">{qty}</span>
                              <button 
                                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                                onClick={() => addToCart({ menuId: item.id, name: item.name, price: item.price, quantity: 1, restaurantId: id! })}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => addToCart({ menuId: item.id, name: item.name, price: item.price, quantity: 1, restaurantId: id! })}
                            >
                              <Plus size={16} className="mr-1" /> Add to Cart
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="w-32 md:w-40 bg-gray-100 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
