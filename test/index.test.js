const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);
const { describe, it } = require("mocha");

describe("index route tests", () => {
    it("/ redirects to /api", (done) => {
        request
            .get("/")
            .expect("Content-Type", "text/plain; charset=utf-8")
            .expect("Location", "/api")
            .expect(302, done);
    });

    it("returns welcome message", (done) => {
        request
            .get("/api")
            .expect("Content-Type", /json/)
            .expect({ message: "Welcome to the API" })
            .expect(200, done);
    });
});
