import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="page-container max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4">Get in Touch</h1>
        <p className="text-gray-600">Have questions? We'd love to hear from you.</p>
      </div>

      <Card className="p-8 md:p-12">
        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
            <p className="text-gray-600">We'll get back to you as soon as possible.</p>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <Input label="First Name" type="text" id="firstName" required />
              <Input label="Last Name" type="text" id="lastName" required />
            </div>
            <Input label="Email Address" type="email" id="email" required />
            <div className="relative">
              <textarea
                id="message"
                rows={5}
                required
                className="block px-4 pb-2.5 pt-6 w-full text-sm text-gray-900 bg-white rounded-xl border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer resize-none"
                placeholder=" "
              ></textarea>
              <label
                htmlFor="message"
                className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary"
              >
                Your Message
              </label>
            </div>
            <Button type="submit" className="w-full h-14 text-lg mt-4">
              Send Message
            </Button>
          </motion.form>
        )}
      </Card>
    </div>
  );
};

export default ContactPage;
