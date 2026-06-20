const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri || uri.includes('<username>')) {
            console.warn("⚠️ MongoDB URI is a placeholder or missing. Falling back to Local Mock Mode.");
            return false;
        }
        await mongoose.connect(uri);
        console.log("✅ MongoDB Connected Successfully");
        return true;
    } catch (error) {
        console.warn("⚠️ MongoDB Connection Failed. Falling back to Local Mock Mode. Error:", error.message);
        return false;
    }
};

module.exports = connectDB;
