const index = require("../routes/index");

const request = require("supertest");
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use("/", index);

describe("index route tests", () => {
    it("returns welcome message", (done) => {
        request(app)
            .get("/")
            .expect("Content-Type", /json/)
            .expect({ message: "Welcome to the API" })
            .expect(200, done);
    });
});
