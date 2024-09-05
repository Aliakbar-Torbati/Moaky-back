// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");
// const cors = require('cors');

const app = express();

// //  Configure CORS
// app.use(cors({
//     origin: 'http://localhost:5173', // Allow your frontend origin
//     credentials: true, // If you need to send cookies with your requests
//   }));


// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const newsletterEmailsRoutes = require("./routes/newsletterEmails.routes.js");
app.use("/newsletter", newsletterEmailsRoutes);

const contactFormRoutes = require("./routes/contactForm.routes.js");
app.use("/contact", contactFormRoutes);
// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
