const express = require("express");
const router = express.Router();

// Require the User model in order to interact with the database
const NewsletterEmail = require("../models/Newsletter.model");

// POST /newsletter/signup  - Creates a new email in the database
router.post("/signup", (req, res, next) => {
  const { email } = req.body;
  console.log("newsletter email added",req.body);
  

  // Check if email is provided as empty strings
  if (email === "") {
    res.status(400).json({ message: "Provide an email" });
    return;
  }

  // This regular expression check that the email is of a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // Check the emails collection if a user with the same email already exists
  NewsletterEmail.findOne({ email })
    .then((foundEmail) => {
      // If the email already exists, send an error response
      if (foundEmail) {
        res.status(400).json({ message: "This email already exists." });
        return;
      }

      // Create the new email in the database
      // We return a pending promise, which allows us to chain another `then`
      return NewsletterEmail.create({ email });
    })
    .then((createdEmail) => {
      // Deconstruct the newly created email
      const { email } = createdEmail;

      // Create a new object
      const newEmail = { email };

      // Send a json response containing the email object
      res.status(201).json({ newEmail: newEmail });
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});


module.exports = router;