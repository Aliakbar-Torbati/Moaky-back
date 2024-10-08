const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const saltRounds = 10;

// POST /auth/signup - Creates a new user in the database
router.post("/signup", (req, res, next) => {
  const { email, password, name , isServiceProvider } = req.body;

  // Check if email, password, or name are provided as empty strings
  if (email === "" || password === "" || name === "") {
    return res
      .status(400)
      .json({ message: "Bitte geben Sie E-Mail, Passwort und Benutzernamen ein." });
  }

  // Regular expression to check if the email is in a valid format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Geben Sie eine gültige E-Mail-Adresse an." });
  }

  // Cehck validity of password
    // Regular expression to check for at least 6 characters, one letter, one number, and one special character
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;  
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Das Passwort muss mindestens 6 Zeichen lang sein und mindestens einen Buchstaben, eine Zahl und ein Sonderzeichen enthalten." });
    }

  // Generate a unique verification token
  const token = crypto.randomBytes(32).toString("hex");

  // Check the users collection if a user with the same email or username exists
  User.findOne({ $or: [{ email }, { name }] })
    .then((foundUser) => {
      if (foundUser) {
        // Email or username already exists
        if (foundUser.email === email) {
          return res.status(400).json({ message: "Diese E-Mail ist bereits vorhanden." });
        } else if (foundUser.name === name) {
          return res.status(400).json({ message: "Dieser Benutzername ist bereits vorhanden. Bitte verwenden Sie einen anderen." });
        }
      }

      // If email and username are unique, hash the password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Create a new user in the database
      User.create({
        email,
        password: hashedPassword,
        name,
        verificationToken: token,
        isVerified: false,
        isServiceProvider: isServiceProvider,
        verificationTokenExpires: Date.now() + 3600000, // Token expires in 1 hour
      });
    // })
    // .then((createdUser) => {
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {

          user: process.env.HOST_EMAIL,
          pass: process.env.HOST_EMAIL_PASS
        },
      });

      const FRONTEND_URL = process.env.ORIGIN || "http://localhost:5173";
      const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
      // const verificationUrl = `https://main--moaky.netlify.app/verify-email?token=${token}`;


      const mailOptions = {

        from: process.env.HOST_EMAIL,
        to: email,
        subject: "Bitte bestätigen Sie Ihre E-Mail",
        html: `Vielen Dank für Ihre Registrierung bei Moaky. Klicken Sie auf den Link unten, um Ihre E-Mail-Adresse zu bestätigen. </p><a href="${verificationUrl}">${verificationUrl}</a>`,
      };

      // Send the verification email
      return transporter.sendMail(mailOptions);
    })
    .then(() => {
      console.log("Verification email sent successfully.");
      res
        .status(201)
        .json({ message: "Anmeldung erfolgreich, Bestätigungs-E-Mail gesendet." });
    })
    .catch((err) => {
      console.error("Fehler bei der Anmeldung oder beim Senden der E-Mail:", err);
      next(err); // In this case, we send error handling to the error handling middleware.
    });
});


// POST /auth/login - Verifies email and password and returns a JWT
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  // Check if email or password are provided as empty strings
  if (email === "" || password === "") {
    return res.status(400).json({ message: "Geben Sie E-Mail und Passwort ein." });
  }

  // Check the users collection if a user with the same email exists
  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        // User not found
        return res.status(401).json({ message: "E-Mail oder Passwort sind falsch!" });
      }

      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { _id, name, age, careSituation, state, hobbies, connectable  } = foundUser;

        // Create an object that will be set as the token payload
        const payload = { _id, name, age, careSituation, state, hobbies, connectable };
        // const payload = { _id, name };

        // Create a JSON Web Token and sign it
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "24h",
        });
      // Check if the user has verifies his email
      if (!foundUser.isVerified) {
        return res.status(400).json({ message: "Bitte bestätigen Sie Ihre E-Mail über den Link, der an Ihre E-Mail gesendet wird." });
      }
        // Send the token as the response
        res.status(200).json({ authToken });
      } else {
        res.status(401).json({ message: "E-Mail oder Passwort sind falsch!" });
      }
    })
    .catch((err) => next(err)); // Error handling
});

// GET /auth/verify - Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  // The payload is available on `req.payload` because `isAuthenticated` middleware decoded the token
  console.log("verify", req.payload);

  const userId = req.payload._id;

  // Fetch the full user data from the database
  User.findById(userId)
    .then((foundUser) => {
      if (!foundUser) {
        return res.status(404).json({ message: "Benutzer nicht gefunden." });
      }

      // Send full user data (excluding sensitive fields like password)
      const { _id, name, age, state, careSituation, hobbies, connectable , isServiceProvider } = foundUser;
      res.status(200).json({ _id, name, age, state, careSituation, hobbies, connectable , isServiceProvider });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Fehler beim Abrufen der Benutzerdaten." });
    });
});

// GET /auth/verifyemail - Used to verify the token which is sended by email to the user
router.get("/verifyemail", (req, res) => {
  const { token } = req.query;
  console.log("req.query", req.query);
  console.log("verify-email", token);
  User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        return res.status(400).send("Token ist ungültig oder abgelaufen.");
      }

      // Mark the user as verified
      user.isVerified = true;
      user.verificationToken = undefined; // Remove the token once verified
      user.verificationTokenExpires = undefined; // Clear the expiration

      user.save().then(() => {
        res.send("E-Mail wurde erfolgreich verifiziert!");
      });
    })
    .catch((err) => res.status(500).send(err));
});

// resending the verification email
router.post("/reverifyemail", (req, res) => {
  const { email } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(404).send({message:"Benutzer nicht gefunden. Du solltest dich zuerst registrieren!"});
      }
      if (user.isVerified) {
        return res.status(400).send({message: "Der Benutzer ist bereits verifiziert. Sie können sich jetzt anmelden!"});
      }

      // Generate a new token and save it
      const token = crypto.randomBytes(32).toString("hex");
      user.verificationToken = token;
      user.verificationTokenExpires = Date.now() + 3600000; // 1 hour

      const transporter = nodemailer.createTransport({
        // info@moaky.de
        service: "Gmail",
        auth: {
          user: process.env.HOST_EMAIL,
          pass: process.env.HOST_EMAIL_PASS,
        },
      });

      user.save().then(() => {
        // Resend the verification email
        const FRONTEND_URL = process.env.ORIGIN || "http://localhost:5173";
        const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

        const mailOptions = {
          from: process.env.HOST_EMAIL,
          to: email,
          subject: "Bitte bestätigen Sie Ihre E-Mail",
          html: `<p>Vielen Dank für Ihre Registrierung bei Moaky. Klicken Sie auf den Link unten, um Ihre E-Mail-Adresse zu bestätigen. </p><a href="${verificationUrl}">${verificationUrl}</a>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          res.status(201).send({message:"Eine neue Bestätigungs-E-Mail wurde gesendet."});
        });
      });
    })
    .catch((err) => res.status(500).send({message: err }));
});


// POST /auth/userinfo - add more info about user
router.post("/userinfo", (req, res, next) => {
  const {name, age, state, hobbies, careSituation, connectable } = req.body;

  // Check the users collection if a user with the same name exists
  User.findOne({ name })
    .then((foundUser) => {
      if (!foundUser) {
        // User not found
        return res.status(401).json({ message: "Benutzer nicht gefunden." });
      }

      // Update the user information
      foundUser.age = age || foundUser.age;
      foundUser.state = state || foundUser.state;
      foundUser.hobbies = hobbies || foundUser.hobbies;
      foundUser.careSituation = careSituation || foundUser.careSituation;
      foundUser.connectable = connectable !== undefined ? connectable : foundUser.connectable;

      // Save the updated user info
      return foundUser.save();
    })
    .then((updatedUser) => {
      // Respond with success message and updated user data
      res.status(200).json({ message: "Benutzerinformationen erfolgreich aktualisiert." });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Benutzerinformationen." });
    });
});



module.exports = router;
