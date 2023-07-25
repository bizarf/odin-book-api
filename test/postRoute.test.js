const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);
const postRoute = require("../routes/postRoute");
const User = require("../models/user");
const { expect } = require("chai");
const agent = supertest.agent(app);

// let mongoServer;

describe("post creation tests", () => {
    it("a post is created", async (done) => {
        const user = await User.find().exec();
        console.log(user);

        // request(app).post("/api/create-post");
    });
});
