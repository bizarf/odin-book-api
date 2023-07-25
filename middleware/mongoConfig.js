const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
require("dotenv").config();

const mongoDb = process.env.MONGODB_KEY;

let mongoServer;

const connectToDatabase = async () => {
    if (process.env.NODE_ENV === "test") {
        if (!mongoServer) {
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        }
    } else {
        await mongoose.connect(mongoDb, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
};

const disconnectDatabase = async () => {
    await mongoose.disconnect();
    if (process.env.NODE_ENV === "test") {
        await mongoServer.stop();
    }
};

// const clearDatabase = async () => {
//     const collections = mongoose.connection.collections;

//     for (const key in collections) {
//         const collection = collections[key];
//         await collection.deleteMany();
//     }
// };

module.exports = {
    connectToDatabase,
    disconnectDatabase,
    // clearDatabase,
};
