const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const initializeMongoServer = async () => {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    mongoose.connect(mongoUri);

    mongoose.connection.on("error", (e) => {
        if (e.message.code === "ETIMEOUT") {
            console.log(e);
            mongoose.connect(mongoUri);
        }
        console.log(e);
    });

    mongoose.connection.once("open", () => {
        console.log(`mongoDB successfully connected to ${mongoUri}`);
    });
};

module.exports = initializeMongoServer;
