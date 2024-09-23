const express = require("express");
const router = express.Router();

// Require a model in order to interact with the database
const CareBenefitsModel = require("../models/CareBenefits.model");

// POST /newsletter/signup  - Creates a new email in the database
router.post("/signup", (req, res, next) => {
  const { email , carebenefit } = req.body;
  console.log("email and carebenefit added",req.body);
  

  // Check if email is provided as empty strings
  if (email === "") {
    res.status(400).json({ message: "Provide an email please" });
    return;
  }

  // This regular expression check that the email is of a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // Check the emails collection if a user with the same email already exists
  CareBenefitsModel.findOne({ email })
    .then((foundEmail) => {
      // If the email already exists, send an error response
      if (foundEmail) {
        res.status(400).json({ message: "This email already exists." });
        return;
      }

      // Create the new email in the database
      // We return a pending promise, which allows us to chain another `then`
      return CareBenefitsModel.create({ email , carebenefit });
    })
    .then((createdCareBenefit) => {
      // Deconstruct the newly created email
      const { email ,carebenefit } = createdCareBenefit;

      // Create a new object
      const newCareBenefit = { email , carebenefit };

      // Send a json response containing the email object
      res.status(201).json({ newCareBenefit: newCareBenefit });
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});


module.exports = router;