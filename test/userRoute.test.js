const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);
const User = require("../models/user");
const { expect } = require("chai");
const {
    connectToDatabase,
    disconnectDatabase,
} = require("../middleware/mongoConfig");

// creates new mongo memory server before test
before(async () => {
    await disconnectDatabase();
    process.env.NODE_ENV = "test";
    await connectToDatabase();
});

// disconnects and removes the memory server after test
after(async () => {
    await disconnectDatabase();
});

// user sign up tests
describe("user sign up tests", () => {
    it("user fails to sign up due to not entering any details", (done) => {
        request
            .post("/api/sign-up")
            .set("Content-Type", "application/json")
            .send({
                firstname: "",
                lastname: "",
                username: "",
                password: "",
                confirmPassword: "",
            })
            .expect(400)
            .end((err, res) => {
                if (err) {
                    done(err);
                } else {
                    expect(res.body.errors).to.be.an("array");
                    expect(res.body.errors.length).equal(5);
                }
                done();
            });
    });

    it("user fails to sign up due to one field being empty", (done) => {
        request
            .post("/api/sign-up")
            .send({
                firstname: "Penny",
                lastname: "",
                username: "psmith@mail.com",
                password: "94hgawht0j",
                confirmPassword: "94hgawht0j",
            })
            .expect("Content-Type", /json/)
            .expect(400)
            .end((err, res) => {
                if (err) {
                    done(err);
                } else {
                    expect(res.body.errors).to.be.an("array");
                    expect(res.body.errors.length).equal(1);
                }
                done();
            });
    });

    it("user fails to sign up due to one password mismatch", (done) => {
        request
            .post("/api/sign-up")
            .send({
                firstname: "Penny",
                lastname: "Smith",
                username: "psmith@mail.com",
                password: "94hgawht0j",
                confirmPassword: "94hgawht0l",
            })
            .expect("Content-Type", /json/)
            .expect(400)
            .end((err, res) => {
                if (err) {
                    done(err);
                } else {
                    expect(res.body.errors).to.be.an("array");
                    expect(res.body.errors.length).equal(1);
                    expect(res.body.errors[0].msg).equal(
                        "The passwords don't match"
                    );
                }
                done();
            });
    });

    it("user fails to sign up as the username has already been taken", async () => {
        const user = new User({
            firstname: "John",
            lastname: "Smith",
            username: "jsmith@mail.com",
            password: "sadfsdfb4",
            joinDate: new Date(),
        });
        await user.save();

        request
            .post("/api/sign-up")
            .send({
                firstname: "Joe",
                lastname: "Smith",
                username: "jsmith@mail.com",
                password: "g03ujff3wf",
                confirmPassword: "g03ujff3wf",
            })
            .expect("Content-Type", /json/)
            .expect(400)
            .end(async (err, res) => {
                if (err) {
                    console.log(err);
                } else {
                    expect(res.body.errors).to.be.an("array");
                    expect(res.body.errors.length).equal(1);
                    expect(res.body.errors[0].msg).equal("User already exists");
                }
            });
    });
});

describe("users successfully signs up", () => {
    it("user makes a new account", (done) => {
        request
            .post("/api/sign-up")
            .send({
                firstname: "Penny",
                lastname: "Jones",
                username: "psmith@mail.com",
                password: "94hgawht0j",
                confirmPassword: "94hgawht0j",
            })
            .expect("Content-Type", /json/)
            .expect(201)
            .end(async (err, res) => {
                if (err) {
                    console.error("Error during signup:", err);
                    done(err);
                } else {
                    expect(res.body.message).to.be.a("string");
                    expect(res.body.message).equal("Sign up was successful!");
                    try {
                        const users = await User.find().exec();
                        expect(users.length).equal(2);
                        done();
                    } catch (err) {
                        done(err);
                    }
                }
            });
    });

    it("two users makes a new account", (done) => {
        request
            .post("/api/sign-up")
            .send({
                firstname: "Mary",
                lastname: "Jones",
                username: "mjones@mail.com",
                password: "85tgoej232",
                confirmPassword: "85tgoej232",
            })

            .expect("Content-Type", /json/)
            .expect(201)
            .end(async (err, res) => {
                if (err) {
                    done(err);
                } else {
                    expect(res.body.message).to.be.a("string");
                    expect(res.body.message).equal("Sign up was successful!");
                }
            });
        request
            .post("/api/sign-up")

            .send({
                firstname: "Jim",
                lastname: "Atkins",
                username: "jimkins@mail.com",
                password: "5tgiolwj0",
                confirmPassword: "5tgiolwj0",
            })
            .expect("Content-Type", /json/)
            .expect(201)
            .end(async (err, res) => {
                if (err) {
                    console.error("Error during signup:", err);
                    done(err);
                } else {
                    expect(res.body.message).to.be.a("string");
                    expect(res.body.message).equal("Sign up was successful!");
                    try {
                        const users = await User.find().exec();
                        if (users) {
                            expect(users.length).equal(4);
                        }
                        done();
                    } catch (err) {
                        done(err);
                    }
                }
            });
    });
});

// user login tests
describe("user fails to login", () => {
    it("user enters in no text", (done) => {
        request
            .get("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "",
                password: "",
            })
            .expect(401)
            .end((err, res) => {
                if (err) {
                    done(err);
                }
                expect(res.body.errors).to.be.an("array");
                expect(res.body.errors.length).equal(2);
                done();
            });
    });

    it("user doesn't enter a username", (done) => {
        request
            .get("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "",
                password: "g093u4vj3",
            })
            .expect(401)
            .end((err, res) => {
                if (err) {
                    done(err);
                }
                expect(res.body.errors).to.be.an("array");
                expect(res.body.errors.length).equal(1);
                done();
            });
    });

    it("user doesn't enter a password", (done) => {
        request
            .get("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "mjones@mail.com",
                password: "",
            })
            .expect(401)
            .end(async (err, res) => {
                if (err) {
                    done(err);
                }
                expect(res.body.errors).to.be.an("array");
                expect(res.body.errors.length).equal(1);
                done();
            });
    });

    it("user enters a username that doesn't exist", (done) => {
        request
            .get("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "mjones2@mail.com",
                password: "85tgoej232",
            })
            .expect(401)
            .end(async (err, res) => {
                if (err) {
                    done(err);
                }
                expect(res.body.errors).to.be.an("array");
                expect(res.body.errors.length).equal(1);
                done();
            });
    });
});

describe("user logs in", () => {
    it("user successfully logs in", () => {
        request
            .get("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "mjones@mail.com",
                password: "85tgoej232",
            })
            .expect(200)
            .end(async (err, res) => {
                if (err) {
                    done(err);
                }
                done();
            });
    });
});
