const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);
const Post = require("../models/post");
const Comment = require("../models/comment");
const { describe, it, before, after } = require("mocha");
const { expect } = require("chai");
const agent = supertest.agent(app);
const { closeDatabase } = require("../utils/config");

describe("comment test", () => {
    let postId;
    let commentId;
    let johnJWT;
    let pollyJWT;
    let johnId;

    // creates new mongo memory server before test
    before(async () => {
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
            .post("/api/create-post")
            .set("Authorization", "Bearer " + johnJWT)
            .send({ postContent: "This is a test" })
            .expect(201);

        const post = await Post.findOne({
            postContent: "This is a test",
        });
        postId = post._id;
        johnId = post.user._id;
    });

    // disconnects and removes the memory server after test
    after(async () => {
        await closeDatabase();
    });

    it("returns a 401 Unauthorized error due to a lack of provided JWT", async () => {
        await agent
            .get(`/api/post/${postId}/comments`)
            .expect(401)
            .expect((res) => {
                expect(res.text).to.be.a("string");
                expect(res.text).to.equal("Unauthorized");
            });
    });

    it("user fails to make a comment", async () => {
        await agent
            .post(`/api/post/${postId}/comment`)
            .set("Authorization", "Bearer " + johnJWT)
            .send({ comment: "" })
            .expect(400)
            .expect((res) => {
                expect(res.body.errors).to.be.an("array");
                expect(res.body.errors[0].msg).to.equal(
                    "The comment must not be empty"
                );
            });
    });

    it("user makes a comment", async () => {
        await agent
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "jsmith@mail.com",
                password: "sadfsdfb4",
            })
            .expect(200);

        await agent
            .post(`/api/post/${postId}/comment`)
            .set("Authorization", "Bearer " + johnJWT)
            .send({ comment: "This is a test comment" })
            .expect(201)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal(
                    "Comment was successfully made"
                );
            });

        const comment = await Comment.findOne({
            comment: "This is a test comment",
            postId: postId,
        });
        commentId = comment._id;
        expect(comment).to.be.an("object");
        expect(comment.comment).to.equal("This is a test comment");

        await request
            .get("/api/posts")
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
            });
    });

    it("another user makes a comment", async () => {
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

        await agent
            .post(`/api/post/${postId}/comment`)
            .set("Authorization", "Bearer " + pollyJWT)
            .send({ comment: "This is Polly's test comment" })
            .expect(201)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(true);
                expect(res.body.message).to.equal(
                    "Comment was successfully made"
                );
            });

        const pollyComment = await Comment.findOne({
            comment: "This is Polly's test comment",
        });

        expect(pollyComment).to.be.an("object");
        expect(pollyComment.comment).to.equal("This is Polly's test comment");
        expect(pollyComment.user._id).to.not.equal(johnId);
    });

    it("gets all comments from the post", async () => {
        await agent
            .get(`/api/post/${postId}/comments`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.allComments).to.be.an("array");
                expect(res.body.allComments.length).to.equal(2);
            });
    });

    it("user fails to edit their comment", async () => {
        await request
            .put(`/api/post/${postId}/comments/${commentId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .send({ comment: "" })
            .expect(400)
            .expect((res) => {
                expect(res.body.errors).to.be.an("array");
                expect(res.body.errors[0].msg).to.equal(
                    "The comment must not be empty"
                );
            });

        const commentCheck = await Comment.findById(commentId);
        expect(commentCheck).to.be.an("object");
        expect(commentCheck.comment).to.equal("This is a test comment");
        expect(commentCheck.edited).to.equal(false);
    });

    it("user edits their comment", async () => {
        await request
            .put(`/api/post/${postId}/comments/${commentId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .send({ comment: "This comment is now edited" })
            .expect(200);

        const commentCheck = await Comment.findById(commentId);
        expect(commentCheck).to.be.an("object");
        expect(commentCheck.comment).to.equal("This comment is now edited");
        expect(commentCheck.edited).to.equal(true);
    });

    it("user likes a comment", async () => {
        await request
            .put(`/api/post/${postId}/comments/${commentId}/like`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body.message).to.equal("Like added to comment");
            });

        const commentCheck = await Comment.findById(commentId);

        expect(commentCheck).to.be.an("object");
        expect(commentCheck.likes).to.equal(1);
    });

    it("another user likes a comment", async () => {
        await request
            .put(`/api/post/${postId}/comments/${commentId}/like`)
            .set("Authorization", "Bearer " + pollyJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body.message).to.equal("Like added to comment");
            });

        const commentCheck = await Comment.findById(commentId);

        expect(commentCheck).to.be.an("object");
        expect(commentCheck.likes).to.equal(2);
    });

    it("user removes a like to a comment", async () => {
        await request
            .put(`/api/post/${postId}/comments/${commentId}/like`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200)
            .expect((res) => {
                expect(res.body.message).to.equal("Like removed from comment");
            });

        const commentCheck = await Comment.findById(commentId);

        expect(commentCheck).to.be.an("object");
        expect(commentCheck.likes).to.equal(1);
    });

    it("user delete's their comment", async () => {
        await agent
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({
                username: "jsmith@mail.com",
                password: "sadfsdfb4",
            })
            .expect(200);

        await agent
            .delete(`/api/post/${postId}/comments/${commentId}`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(200);

        const commentCheck = await Comment.findById(commentId);
        expect(commentCheck).to.equal(null);
    });

    it("user fails to delete another user's comment", async () => {
        const pollyComment = await Comment.findOne({
            comment: "This is Polly's test comment",
        });

        await agent
            .delete(`/api/post/${postId}/comments/${pollyComment._id}`)
            .set("Authorization", "Bearer " + johnJWT)
            .expect(401)
            .expect((res) => {
                expect(res.body).to.be.an("object");
                expect(res.body.success).to.equal(false);
                expect(res.body.message).to.equal(
                    "You are not authorized to delete this comment"
                );
            });
    });
});
