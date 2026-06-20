require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const Restaurant = require('./models/Restaurant');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let isDbConnected = false;

// Mock Data Fallback
const mockRestaurants = [
    { id: '1', name: 'Spice Route', cuisine: 'Indian', rating: 4.5, address: '123 Curry Lane', image: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=800&q=80' },
    { id: '2', name: 'Sushi Zen', cuisine: 'Japanese', rating: 4.8, address: '456 Maki St', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80' },
    { id: '3', name: 'Pizza Paradise', cuisine: 'Italian', rating: 4.2, address: '789 Dough Ave', image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80' }
];

connectDB().then(connected => {
    isDbConnected = connected;
});

app.get('/api/restaurants', async (req, res) => {
    if (!isDbConnected) return res.json(mockRestaurants);
    
    try {
        const restaurants = await Restaurant.find({});
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: 'Server error retrieving restaurants' });
    }
});

app.get('/api/restaurants/:id', async (req, res) => {
    if (!isDbConnected) {
        const r = mockRestaurants.find(x => x.id === req.params.id);
        return r ? res.json(r) : res.status(404).json({ error: 'Restaurant not found' });
    }

    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ error: 'Server error retrieving restaurant' });
    }
});

app.listen(port, () => {
    console.log(`Restaurant service listening at http://localhost:${port}`);
});
