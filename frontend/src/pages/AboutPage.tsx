import { motion } from 'framer-motion';
import { Server, Database, Code, Globe } from 'lucide-react';
import Card from '../components/Card';

const AboutPage = () => {
  const services = [
    {
      title: "Frontend UI",
      tech: "React + Vite + Tailwind",
      icon: <Globe size={32} className="text-blue-500" />,
      desc: "The Orchestrator. Provides a seamless user interface and aggregates data across all microservices using direct REST calls."
    },
    {
      title: "Restaurant Service",
      tech: "Node.js + Express",
      icon: <Server size={32} className="text-green-500" />,
      desc: "Manages restaurant profiles, locations, and metadata. Serves data on Port 3001."
    },
    {
      title: "Menu Service",
      tech: "Python + FastAPI",
      icon: <Database size={32} className="text-yellow-500" />,
      desc: "Handles menus, pricing, and item descriptions. Fast and typed responses on Port 3002."
    },
    {
      title: "Order Service",
      tech: "Go + Gin",
      icon: <Code size={32} className="text-cyan-500" />,
      desc: "Processes checkout carts and generates orders with lightning speed. Runs on Port 3003."
    },
    {
      title: "Delivery Service",
      tech: "Java + Spring Boot",
      icon: <Server size={32} className="text-red-500" />,
      desc: "Manages delivery tracking and driver assignment. Receives instant handoffs. Runs on Port 3004."
    }
  ];

  return (
    <div className="page-container max-w-5xl">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black mb-6"
        >
          Polyglot Architecture
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
        >
          FOOD-DASH is built on a loosely coupled microservices architecture. 
          Each service is developed using a different technology stack, demonstrating 
          how disparate systems can integrate seamlessly to deliver a unified user experience.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-8 h-full">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                  <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-mono text-gray-600 mb-4">
                    {service.tech}
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AboutPage;
