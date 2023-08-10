const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);
const Post = require("../models/post");
const { expect } = require("chai");
const agent = supertest.agent(app);
const {
    connectToDatabase,
    disconnectDatabase,
} = require("../middleware/mongoConfig");

describe("post tests", () => {
    let postId;
    let johnJWT;
    let pollyJWT;
    let johnId;
    // let pollyId;

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
    });

    // disconnects and removes the memory server after test
    after(async () => {
        await disconnectDatabase();
    });

    it("returns a 401 Unauthorized error due to a lack of provided JWT", (done) => {
        request
            .get("/api/posts")
            .expect(401)
            .end(async (err, res) => {
                if (err) return done(err);

                expect(res.text).to.be.a("string");
                expect(res.text).to.equal("Unauthorized");
                done();
            });
    });

    it("user fails to make a post", (done) => {
        agent
            .post("/api/create-post")
            .set("Authorization", "Bearer " + johnJWT)
            .expect(400)
            .end(async (err, res) => {
                if (err) done(err);

                expect(res.body.errors).to.be.an("array");
                expect(res.body.errors[0].msg).to.equal(
                    "The post must not be empty"
                );
                done();
            });
    });

    it("user makes a post", async () => {
        await agent
            .post("/api/create-post")
            .set("Authorization", "Bearer " + johnJWT)
            .send({ postContent: "This is a test" })
            .expect(201)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal("Post was successfully made");
            });

        const post = await Post.findOne({
            postContent: "This is a test",
        }).exec();

        expect(post).to.be.an("object");
        expect(post.postContent).to.equal("This is a test");
    });

    it("user fails to edit a post", async () => {
        await agent
            .post("/api/create-post")
            .set("Authorization", "Bearer " + johnJWT)
            .send({ postContent: "This is a test 2" })
            .expect(201);

        const post = await Post.findOne({
            postContent: "This is a test 2",
        });
        postId = post._id;

        expect(post).to.be.an("object");
        expect(post.postContent).to.equal("This is a test 2");

        await agent
            .put(`/api/post/${postId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .send({ postContent: "" })
            .expect(400);

        const postCheck = await Post.findOne({
            postContent: "This is a test 2",
            _id: postId,
        });
        expect(postCheck).to.be.an("object");
        expect(postCheck.postContent).to.equal("This is a test 2");
        expect(postCheck.edited).to.equal(false);
    });

    it("user successfully edits a post", async () => {
        const post = await Post.findOne({
            postContent: "This is a test 2",
        });
        postId = post._id;

        expect(post).to.be.an("object");
        expect(post.postContent).to.equal("This is a test 2");
        expect(post.edited).to.equal(false);

        await request
            .put(`/api/post/${postId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .send({ postContent: "This is an edited test" })
            .expect(200);

        const postCheck = await Post.findOne({
            postContent: "This is an edited test",
            _id: postId,
        });
        expect(postCheck).to.be.an("object");
        expect(postCheck.postContent).to.equal("This is an edited test");
        expect(postCheck.edited).to.equal(true);
    });

    it("user successfully deletes a post", async () => {
        const post = await Post.findOne({
            postContent: "This is an edited test",
        });
        postId = post._id;

        expect(post).to.be.an("object");
        expect(post.postContent).to.equal("This is an edited test");
        expect(post.edited).to.equal(true);

        await request
            .delete(`/api/post/${postId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(204);

        const postCheck = await Post.find({
            postContent: "This is an edited test",
            _id: postId,
        });
        expect(postCheck).to.be.an("array");
        expect(postCheck.length).to.equal(0);
    });

    it("gets all posts", async () => {
        await request
            .get("/api/posts")
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.timeline.length).to.equal(1);
                expect(res.body.timeline[0].postContent).to.equal(
                    "This is a test"
                );
                console.log(res.body.timeline[0]);
            });
    });

    it("get a single post", async () => {
        const post = await Post.findOne({
            postContent: "This is a test",
        });
        postId = post._id;

        expect(post).to.be.an("object");
        expect(post.postContent).to.equal("This is a test");
        expect(post.edited).to.equal(false);

        await request
            .get(`/api/post/${postId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body._id).to.equal(postId.toString());
                expect(res.body.postContent).to.equal(post.postContent);
                expect(res.body.edited).to.equal(false);
            });
    });

    it("user adds a like to a post", async () => {
        const post = await Post.findOne({
            postContent: "This is a test",
        });
        postId = post._id;

        expect(post).to.be.an("object");
        expect(post.postContent).to.equal("This is a test");
        expect(post.edited).to.equal(false);

        await request
            .put(`/api/post/${postId}/like`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body.message).to.equal("Like added to post");
            });

        const checkPost = await Post.findOne({
            postContent: "This is a test",
            _id: postId,
        });

        expect(checkPost).to.be.an("object");
        expect(checkPost.likes).to.equal(1);
    });

    it("another user adds a like to the first post", async () => {
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

        await request
            .put(`/api/post/${postId}/like`)
            .set("Authorization", "Bearer " + pollyJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body.message).to.equal("Like added to post");
            });

        const checkPost = await Post.findOne({
            postContent: "This is a test",
            _id: postId,
        });

        expect(checkPost).to.be.an("object");
        expect(checkPost.likes).to.equal(2);
    });

    it("user removes a like to a post", async () => {
        const post = await Post.findOne({
            postContent: "This is a test",
        });
        postId = post._id;

        expect(post).to.be.an("object");
        expect(post.postContent).to.equal("This is a test");
        expect(post.edited).to.equal(false);

        await request
            .put(`/api/post/${postId}/like`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body.message).to.equal("Like removed from post");
            });

        const checkPost = await Post.findOne({
            postContent: "This is a test",
            _id: postId,
        });

        expect(checkPost).to.be.an("object");
        expect(checkPost.likes).to.equal(1);
    });

    it("another user makes a post", async () => {
        await agent.get("/api/logout").expect(200);

        await agent
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "polariel@mail.com",
                password: "340g3g0gue0",
            })
            .expect(200);

        await agent
            .post("/api/create-post")
            .set("Authorization", "Bearer " + pollyJWT)
            .send({ postContent: "This is Polly's post" })
            .expect(201)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal("Post was successfully made");
            });

        const pollyPost = await Post.findOne({
            postContent: "This is Polly's post",
        }).exec();

        expect(pollyPost).to.be.an("object");
        expect(pollyPost.postContent).to.equal("This is Polly's post");
        expect(pollyPost.user._id).to.not.equal(johnId);
    });

    it("user fails to delete another user's comment", async () => {
        const pollyPost = await Post.findOne({
            postContent: "This is Polly's post",
        }).exec();

        await agent
            .delete(`/api/post/${pollyPost._id}`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(401)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(false);
                expect(res.body.message).to.equal(
                    "You are not authorized to delete this post"
                );
            });
    });
});
