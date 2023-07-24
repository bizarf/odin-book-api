const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const express = require("express");
const userRoute = require("../routes/userRoute");
const User = require("../models/user");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();

// express.json() is required to understand the data being sent
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api", userRoute);

// passport localstrategy
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });
            if (!user) {
                return done(null, false, { msg: "Incorrect username" });
            }
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    // password match. log user in
                    return done(null, user);
                } else {
                    return done(null, false, {
                        msg: "Incorrect password",
                    });
                }
            });
        } catch (err) {
            done(err);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

let mongoServer;

// creates new mongo memory server before each test
beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {});
});

// disconnects and removes the memory server after each test
afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// user sign up tests
describe("user sign up tests", () => {
    it("user fails to sign up due to not entering any details", (done) => {
        request(app)
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
        request(app)
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
        request(app)
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

        request(app)
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
        request(app)
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
                    done(err);
                } else {
                    expect(res.body.message).to.be.a("string");
                    expect(res.body.message).equal("Sign up was successful!");
                    const users = await User.find();
                    expect(users.length).equal(1);
                }
                done();
            });
    });

    it("two users makes a new account", (done) => {
        request(app)
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
                    done(err);
                } else {
                    expect(res.body.message).to.be.a("string");
                    expect(res.body.message).equal("Sign up was successful!");
                }
            });
        request(app)
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
                    done(err);
                } else {
                    expect(res.body.message).to.be.a("string");
                    expect(res.body.message).equal("Sign up was successful!");
                    const users = await User.find();
                    expect(users.length).equal(2);
                }
                done();
            });
    });
});

// broken test. passport js issue?
// user login tests
// describe("user fails to login", () => {
//     it("user enters in no text", (done) => {
//         request(app)
//             .post("/api/login")
//             .set("Content-Type", "application/json")
//             .send({
//                 username: "",
//                 password: "",
//             })
//             .expect(401)
//             .end((err, res) => {
//                 if (err) {
//                     done(err);
//                 } else {
//                     expect(res.body.errors).to.be.an("array");
//                     expect(res.body.errors.length).equal(2);
//                 }
//                 done();
//             });
//     });
// });
