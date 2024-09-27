const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);
const User = require("../models/user");
const { after, describe, it, done } = require("mocha");
const { expect } = require("chai");
const { closeDatabase } = require("../utils/config");

// disconnects and removes the memory server after test
after(async () => {
    await closeDatabase();
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
        await request
            .post("/api/sign-up")
            .send({
                firstname: "John",
                lastname: "Smith",
                username: "jsmith@mail.com",
                password: "sadfsdfb4",
                confirmPassword: "sadfsdfb4",
            })
            .expect("Content-Type", /json/)
            .expect(201);

        await request
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
            .expect((res) => {
                expect(res.body.errors).to.be.an("array");
                expect(res.body.errors.length).equal(1);
                expect(res.body.errors[0].msg).equal("User already exists");
            });
    });
});

describe("users successfully signs up", () => {
    let johnId;
    let pennyJWT;
    let johnJWT;

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
                        johnId = users[0]._id;
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

    it("user details are retrived", async () => {
        await request
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "psmith@mail.com",
                password: "94hgawht0j",
            })
            .expect(200)
            .expect((res) => {
                pennyJWT = res.body.token;
            });

        await request
            .get(`/api/profile/${johnId}`)
            .set("Authorization", "Bearer " + pennyJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.user).to.be.an("object");
                expect(res.body.user.username).to.equal("jsmith@mail.com");
                expect(res.body.user.firstname).to.equal("John");
                expect(res.body.user.lastname).to.equal("Smith");
            });
    });

    it("John edits his lastname", async () => {
        await request
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "jsmith@mail.com",
                password: "sadfsdfb4",
            })
            .expect(200)
            .expect((res) => {
                johnJWT = res.body.token;
            });

        await request
            .put(`/api/profile/${johnId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .send({
                firstname: "John",
                lastname: "Powers",
                username: "jsmith@mail.com",
                photo: "",
            })
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
            });

        const updatedJohn = await User.find({
            firstname: "John",
            lastname: "Powers",
        });

        expect(updatedJohn.length).to.equal(1);
        expect(updatedJohn[0].firstname).to.equal("John");
        expect(updatedJohn[0].lastname).to.equal("Powers");
    });

    it("John fails to change his username, as the username is already taken", async () => {
        await request
            .put(`/api/profile/${johnId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .send({
                firstname: "John",
                lastname: "Smith",
                username: "mjones@mail.com",
                photo: "",
            })
            .expect(400)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.errors[0].msg).to.equal("User already exists");
            });
    });
});

// user login tests
describe("user fails to login", () => {
    it("user enters in no text", (done) => {
        request
            .post("/api/login")
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
            .post("/api/login")
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
            .post("/api/login")
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
            .post("/api/login")
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
            .post("/api/login")
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

    it("demo user logs in", async () => {
        await request
            .post("/api/sign-up")
            .send({
                firstname: "Demo",
                lastname: "Account",
                username: process.env.DEMO_USERNAME,
                password: process.env.DEMO_PASSWORD,
                confirmPassword: process.env.DEMO_PASSWORD,
            })
            .expect(201);

        await request
            .post("/api/login-demo")
            .expect(200)
            .expect((res) => {
                expect(res.body.token).to.be.a("string");
            });
    });
});
