const mongoose = require("mongoose");

const mongoDb = process.env.MONGODB_KEY;

mongoose.connect(mongoDb, { useNewUrlParser: true });
// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "mongo connection error"));

const main = async () => {
    await mongoose.connect(mongoDb);
    console.log("loaded mongoose");
};
main().catch((err) => console.log(err));
