const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cuisine: { type: String, required: true },
    rating: { type: Number, required: true },
    address: { type: String },
    imageUrl: { type: String }
});

// To ensure id is returned instead of _id for frontend compatibility
restaurantSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
