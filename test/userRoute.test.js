const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const express = require("express");
const userRoute = require("../routes/userRoute");
// const initializeMongoServer = require("../mongo/mongoConfigTesting");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use("/api", userRoute);

let mongoServer;

before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {});
});

after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("user route tests", () => {
    it("user fails to sign up", (done) => {
        request(app)
            .post("/api/sign-up")
            .send({
                firstname: "",
                lastname: "",
                username: "",
                password: "",
                confirmPassword: "",
            })
            .expect(200)
            .end((err, res) => {
                if (err) done(err);
                done();
            });
    });
});
