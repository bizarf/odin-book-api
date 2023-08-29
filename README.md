# The Odin Project - Project: Odin-Book API

The goal of this project is to make a Facebook clone using all that I've learnt. This is the REST API for that clone.

-   [View the live site here](link goes here)
-   [View the book client repo](https://github.com/bizarf/odin-book-client)

#### Install:

To run this project on your local server, first install the dependencies with the command:

```
npm install
```

Next you will need to create a ".env" file at the root of the project. You will now need to create a database on MongoDB Atlas. Inside the ".env" file replace the end string with your database's connection string. The Facebook app keys require a Meta account and can be found in the developers area.

```
MONGODB_KEY="AMONGODBATLASKEY"
JWT_SECRET="AJWTSECRETKEY"
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
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
