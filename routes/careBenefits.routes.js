const express = require("express");
const router = express.Router();

// Require a model in order to interact with the database
const CareBenefitsModel = require("../models/CareBenefits.model");

// POST /newsletter/signup  - Creates a new email in the database or updates the selectedOption if the email already exists
router.post("/signup", (req, res, next) => {
  const { email, selectedOption } = req.body;
  console.log("email and carebenefit added", req.body);

  // Check if email is provided as an empty string
  if (email === "") {
    res.status(400).json({ message: "Provide an email please" });
    return;
  }

  // This regular expression checks that the email is of a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // Check if the email already exists in the database
  CareBenefitsModel.findOne({ email })
    .then((foundEmail) => {
      if (foundEmail) {
        // If the email exists and selectedOption is the same, no need to update
        if (foundEmail.selectedOption === selectedOption) {
          res
            .status(200)
            .json({ message: `Ihre Anfrage über ${selectedOption} wurde erfolgreich gespeichert.` });
          return;
        } else {
          // Update the selectedOption if it's different
          CareBenefitsModel.findOneAndUpdate(
            { email },
            { selectedOption }, // Update the selectedOption
            { new: true } // Return the updated document
          )
            .then((updatedEmail) => {
              res.status(200).json({
                message: `Ihre Anfrage wurde erfolgreich in ${selectedOption} geändert.`,
                updatedEmail,
              });
            })
            .catch((err) => next(err));
          return;
        }
      }

      // If the email does not exist, create a new entry
      return CareBenefitsModel.create({ email, selectedOption });
    })
    .then((createdCareBenefit) => {
      if (createdCareBenefit) {
        const { email, selectedOption } = createdCareBenefit;
        const newCareBenefit = { email, selectedOption };

        // Send a json response containing the new email object
        res.status(201).json({
          message: `Ihre Anfrage über ${selectedOption} wurde erfolgreich gespeichert.`,
          newCareBenefit,
        });
      }
    })
    .catch((err) => next(err)); // Error handling middleware
});

module.exports = router;
