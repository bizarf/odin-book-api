const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);
const User = require("../models/user");
const Post = require("../models/post");
const { expect } = require("chai");
const agent = supertest.agent(app);
const {
    connectToDatabase,
    disconnectDatabase,
    // clearDatabase,
} = require("../middleware/mongoConfig");

// // creates new mongo memory server before test
// beforeAll(async () => {
//     await disconnectDatabase();
//     process.env.NODE_ENV = "test";
//     const dataConnection = await connectToDatabase();

//     if (dataConnection) {
//         const user = new User({
//             firstname: "John",
//             lastname: "Smith",
//             username: "jsmith@mail.com",
//             password: "sadfsdfb4",
//             joinDate: new Date(),
//         });
//         await user.save();
//     }
// });

// // disconnects and removes the memory server after test
// afterAll(async () => {
//     await disconnectDatabase();
// });

describe("post tests", () => {
    let postId;

    // creates new mongo memory server before test
    before(async () => {
        await disconnectDatabase();
        process.env.NODE_ENV = "test";
        await connectToDatabase();
        await agent.post("/api/sign-up").send({
            firstname: "John",
            lastname: "Smith",
            username: "jsmith@mail.com",
            password: "sadfsdfb4",
            confirmPassword: "sadfsdfb4",
        });

        // const user = new User({
        //     firstname: "John",
        //     lastname: "Smith",
        //     username: "jsmith@mail.com",
        //     password: "sadfsdfb4",
        //     joinDate: new Date(),
        // });
        // await user.save();
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
        request
            .post("/api/create-post")
            .set("Authorization", "Bearer " + process.env.TEST_JWT)
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

    it("user makes a post", (done) => {
        request
            .post("/api/create-post")
            .set("Authorization", "Bearer " + process.env.TEST_JWT)
            .send({ postContent: "This is a test" })
            .expect(201)
            .end(async (err, res) => {
                if (err) done(err);
                const post = await Post.find({ postContent: "This is a test" });

                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal("Post was successfully made");
                expect(post).to.be.an("array");
                expect(post.length).to.equal(1);
                expect(post[0].postContent).to.equal("This is a test");
                done();
            });
    });

    it("user fails to edit a post", async () => {
        await request
            .post("/api/create-post")
            .set("Authorization", "Bearer " + process.env.TEST_JWT)
            .send({ postContent: "This is a test 2" })
            .expect(201);

        const post = await Post.findOne({
            postContent: "This is a test 2",
        });
        postId = post._id;

        expect(post).to.be.an("object");
        expect(post.postContent).to.equal("This is a test 2");

        await request
            .put(`/api/post/${postId}`)
            .set("Authorization", "Bearer " + process.env.TEST_JWT)
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
            .set("Authorization", "Bearer " + process.env.TEST_JWT)
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
            .set("Authorization", "Bearer " + process.env.TEST_JWT)
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
            .set("Authorization", "Bearer " + process.env.TEST_JWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.timeline.length).to.equal(1);
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
            .set("Authorization", "Bearer " + process.env.TEST_JWT)
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
            .set("Authorization", "Bearer " + process.env.TEST_JWT)
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
});
