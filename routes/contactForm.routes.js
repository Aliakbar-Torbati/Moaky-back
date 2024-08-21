const express = require("express");
const router = express.Router();

// Require a model in order to interact with the database
const ContactForm = require("../models/ContactForm.model");

// POST /contact/contactform  - Creates a new message in the database
router.post("/contactform", (req, res, next) => {
  const { name, email, subject, message } = req.body;
  console.log("message sended", req.body);

  // Check if the required parts are provided
  if (email === "") {
    res.status(400).json({ message: "Provide an email to contact please" });
    return;
  }
  if (subject === "") {
    res.status(400).json({ message: "Provide a topic please" });
    return;
  }
  if (message === "") {
    res.status(400).json({ message: "insert your message please" });
    return;
  }

  // This regular expression check that the email is of a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address please." });
    return;
  }

      // Create the new email in the database
      // We return a pending promise, which allows us to chain another `then`
    ContactForm.create({ name, email, subject, message })
    .then((createdmessage) => {
      // Deconstruct the newly created email
      const { name, email, subject, message } = createdmessage;

      // Create a new object
      const newSubject = { subject };

      // Send a json response containing the subject
      res.status(201).json({ newSubject: newSubject });
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});

module.exports = router;
