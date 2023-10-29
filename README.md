# The Odin Project - Project: Odin-Book API

The goal of this project is to make a Facebook clone using all that I've learnt. This is the REST API for that clone.

-   [View the live site here](https://bizarf.github.io/odin-book-client/)
-   [View the book client repo](https://github.com/bizarf/odin-book-client)

#### Install:

To run this project on your local server, first install the dependencies with the command:

```
npm install
```

Next you will need to create a ".env" file at the root of the project. You will now need to create a database on MongoDB Atlas. Inside the ".env" file replace the end string with your database's connection string. The GitHub app keys require a GitHub account and can be found in the developers area after creating an app.

```
MONGODB_KEY="AMONGODBATLASKEY"
JWT_SECRET="AJWTSECRETKEY"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
DEMO_USERNAME=""
DEMO_PASSWORD=""
```

After that is done, you can start the server with:

```
npm start
```

<hr>

##### Tools and technologies used:

-   Express Generator
-   Dotenv
-   Mongoose
-   BCrypt JS
-   Passport
-   Jsonwebtoken
-   Mocha with Chai
-   Supertest
