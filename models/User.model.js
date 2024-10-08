const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    name: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
    },
    age: {
      type: Number,
    },
    state: {
      type: String,
    },
    hobbies: {
      type: String,
    },
    careSituation: {
      type: String,
    },
    connectable: {
      type: String,
    },
    verificationToken: {
      type: String,
    },
    isVerified: {
      type: Boolean,
    },
    isServiceProvider: {
      type: Boolean,
    },
    verificationTokenExpires: {
      type: Number,
    },

  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;
