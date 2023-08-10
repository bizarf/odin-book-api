const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);
const User = require("../models/user");
const FriendRequest = require("../models/friendRequest");
const { expect } = require("chai");
const agent = supertest.agent(app);
const {
    connectToDatabase,
    disconnectDatabase,
} = require("../middleware/mongoConfig");

describe("friends route test", () => {
    let johnJWT;
    let pollyJWT;
    let johnId;
    let pollyId;

    // creates new mongo memory server before test
    before(async () => {
        await disconnectDatabase();
        process.env.NODE_ENV = "test";
        await connectToDatabase();
        // create our test user
        await agent
            .post("/api/sign-up")
            .send({
                firstname: "John",
                lastname: "Smith",
                username: "jsmith@mail.com",
                password: "sadfsdfb4",
                confirmPassword: "sadfsdfb4",
            })
            .expect(201);

        await agent
            .post("/api/sign-up")
            .send({
                firstname: "Polly",
                lastname: "Ariel",
                username: "polariel@mail.com",
                password: "340g3g0gue0",
                confirmPassword: "340g3g0gue0",
            })
            .expect(201);

        await agent
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

        await agent
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "polariel@mail.com",
                password: "340g3g0gue0",
            })
            .expect(200)
            .expect((res) => {
                pollyJWT = res.body.token;
            });

        const john = await User.findOne({ firstname: "John" }).exec();
        const polly = await User.findOne({ firstname: "Polly" }).exec();
        johnId = john._id;
        pollyId = polly._id;
    });

    // disconnects and removes the memory server after test
    after(async () => {
        await disconnectDatabase();
    });

    it("John sends a friend request to Polly", async () => {
        await agent
            .post(`/api/send-friend-request/${pollyId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal(
                    "Friend request successfully sent"
                );
            });

        const friendReq = await FriendRequest.findOne({
            sender: johnId,
        }).exec();

        expect(friendReq.sender.toString()).to.equal(johnId.toString());
        expect(friendReq.receiver.toString()).to.equal(pollyId.toString());
        expect(friendReq.status).to.equal("pending");
    });

    it("John fails to send another friend request to Polly", async () => {
        await agent
            .post(`/api/send-friend-request/${pollyId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(400)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(false);
                expect(res.body.message).to.equal(
                    "Friend request already sent or accepted"
                );
            });

        const friendReq = await FriendRequest.findOne({
            sender: johnId,
        }).exec();

        expect(friendReq.sender.toString()).to.equal(johnId.toString());
        expect(friendReq.receiver.toString()).to.equal(pollyId.toString());
        expect(friendReq.status).to.equal("pending");
    });

    it("Polly fails to send a friend request to John as there is one already pending", async () => {
        await agent
            .post(`/api/send-friend-request/${johnId}`)
            .set("Authorization", "Bearer " + pollyJWT)
            .expect(400)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(false);
                expect(res.body.message).to.equal(
                    "Friend request already sent or accepted"
                );
            });

        const friendReq = await FriendRequest.findOne({
            sender: johnId,
        }).exec();

        expect(friendReq.sender.toString()).to.equal(johnId.toString());
        expect(friendReq.receiver.toString()).to.equal(pollyId.toString());
        expect(friendReq.status).to.equal("pending");
    });

    it("John checks their pending friend requests and finds a request", async () => {
        await agent
            .get("/api/get-pending-friends")
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.existingRequest).to.be.an("array");
                expect(res.body.existingRequest.length).to.equal(1);
                expect(res.body.existingRequest[0].status).to.equal("pending");
            });
    });

    it("Polly checks their pending friend requests and finds a request", async () => {
        await agent
            .get("/api/get-pending-friends")
            .set("Authorization", "Bearer " + pollyJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.existingRequest).to.be.an("array");
                expect(res.body.existingRequest.length).to.equal(1);
                expect(res.body.existingRequest[0].status).to.equal("pending");
            });
    });

    it("John can't accept the friend request he sent to Polly", async () => {
        await agent
            .put(`/api/friend-request-accept/${pollyId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(404)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(false);
                expect(res.body.message).to.equal(
                    "The friend request does not exist"
                );
            });

        const polly = await User.findById(pollyId);
        expect(polly.friends).to.be.an("array");
        expect(polly.friends.length).to.equal(0);
    });

    it("Polly accepts John's friend request", async () => {
        await agent
            .put(`/api/friend-request-accept/${johnId}`)
            .set("Authorization", "Bearer " + pollyJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal("Friend request accepted");
            });

        const polly = await User.findById(pollyId);
        expect(polly.friends).to.be.an("array");
        expect(polly.friends.length).to.equal(1);
        expect(polly.friends[0].toString()).to.equal(johnId.toString());
    });

    it("Polly is already friends with John so she can't accept another friend request", async () => {
        await agent
            .put(`/api/friend-request-accept/${johnId}`)
            .set("Authorization", "Bearer " + pollyJWT)
            .expect(400)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(false);
                expect(res.body.message).to.equal("Already friends");
            });

        const polly = await User.findById(pollyId);
        expect(polly.friends).to.be.an("array");
        expect(polly.friends.length).to.equal(1);
        expect(polly.friends[0].toString()).to.equal(johnId.toString());
    });

    it("Polly checks their friend list and see's one user", async () => {
        await agent
            .get("/api/get-friends")
            .set("Authorization", "Bearer " + pollyJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.friendsList.friends).to.be.an("array");
                expect(res.body.friendsList.friends.length).to.equal(1);
            });
    });

    it("Polly removes a John from her friends list", async () => {
        await agent
            .delete(`/api/unfriend/${johnId}`)
            .set("Authorization", "Bearer " + pollyJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal("Friend removed");
            });

        const polly = await User.findById(pollyId);
        expect(polly.friends.length).to.equal(0);
    });

    it("user rejects a friend request", async () => {
        await agent
            .post(`/api/send-friend-request/${pollyId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal(
                    "Friend request successfully sent"
                );
            });

        await agent
            .put(`/api/friend-request-reject/${johnId}`)
            .set("Authorization", "Bearer " + pollyJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal("Friend request rejected");
            });

        const polly = await User.findById(pollyId);
        expect(polly.friends).to.be.an("array");
        expect(polly.friends.length).to.equal(0);

        const friendRequest = await FriendRequest.findOne({
            $or: [
                { sender: johnId, receiver: pollyId },
                { sender: pollyId, receiver: johnId },
            ],
        });
        expect(friendRequest).to.be.an("object");
        expect(friendRequest.status).to.equal("rejected");
    });
});
