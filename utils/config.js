require("dotenv").config();
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const PORT = process.env.PORT || 3000;

let mongoServer;

const connectToDatabase = async () => {
    if (process.env.NODE_ENV === "production") {
        mongoose
            .connect(process.env.MONGODB_KEY)
            .then(() => {
                console.log("Connected to MongoDB");
            })
            .catch((err) => {
                console.log("Failed to connect to MongoDB:", err.message);
            });
    } else {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        mongoose
            .connect(uri)
            .then(() => {
                console.log("Connected to Mongo Memory Server");
            })
            .catch((err) => {
                console.log("Mongo memory server failed to load:", err.message);
            });
    }
};

const closeDatabase = async () => {
    await mongoose.connection.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
};

module.exports = { PORT, connectToDatabase, closeDatabase, mongoServer };
