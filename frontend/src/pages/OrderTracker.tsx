import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import Button from '../components/Button';

interface DeliveryStatus {
  orderId: string;
  status: string;
  driverName: string;
  message: string;
}

const OrderTracker = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<DeliveryStatus | null>(null);

  useEffect(() => {
    // Fetch once instead of polling, as handoff is instant now
    axios.get(`/api/delivery/${id}`)
      .then(res => setStatus(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!status) {
    return <div className="page-container text-center py-32 animate-pulse">Confirming your order...</div>;
  }

  return (
    <div className="page-container max-w-3xl py-12">
      <Card className="text-center p-12 relative overflow-hidden">
        {/* Background Confetti/Shapes can go here */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-orange-300"></div>

        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-inner"
        >
          <CheckCircle size={50} strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-xl text-gray-500 mb-8">{status.message}</p>

          <div className="bg-gray-50 rounded-2xl p-6 text-left mb-8 max-w-md mx-auto border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-4">Order Details</h3>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Order ID</span>
              <span className="font-mono font-bold">#{status.orderId}</span>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Status</span>
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold text-sm">
                <Package size={14} /> {status.status}
              </span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-gray-600">Delivery Partner</span>
              <span className="font-bold text-gray-900">{status.driverName}</span>
            </div>
          </div>

          <Link to="/">
            <Button variant="outline" className="gap-2">
              Back to Home <ArrowRight size={18} />
            </Button>
          </Link>
        </motion.div>
      </Card>
    </div>
  );
};

export default OrderTracker;
