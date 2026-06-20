import React from 'react';
import { motion } from 'framer-motion';

interface CardProps extends React.ComponentProps<typeof motion.div> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-primary/30 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
