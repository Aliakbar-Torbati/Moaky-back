// const { Schema, model } = require("mongoose");

const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Reference to the User model (if the user is logged in)
    default: null // Allows for null values for anonymous users
  },
  userName: { 
    type: String, 
    default: "Anonymous" // Default name for anonymous users
  },
  userEmail: {
    type: String, 
    default: null // Optional email field for anonymous users
  },
  value: { 
    type: Number, 
    required: true,
    min: 1, // Minimum rating value (e.g., 1)
    max: 5  // Maximum rating value (e.g., 5)
  },
  comment: {
    type: String, 
    default: "" // Optional comment by the user
  },
  date: { 
    type: Date, 
    default: Date.now // Timestamp of the rating
  }
});

const careServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, 
      },
      catagory: {
        type: String,
        required: true, 
      },
      street: {
        type: String,
        required: true, 
      },
      postcode: {
        type: String,
        required: true, 
      },
      city: {
        type: String,
        required: true, 
      },
      phone: {
        type: String,
      },
      fax: {
        type: String,
      },
      email: {
        type: String,
      },
      website: {
        type: String,
      },
      services: {
        type: String,
      },
  ratings: [ratingSchema], // Array of ratings
  averageRating: { 
    type: Number, 
    default: 0 
  },
  numberOfRatings: { 
    type: Number, 
    default: 0 
  }
});

// Middleware to calculate the average rating and number of ratings
careServiceSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length > 0) {
    const total = this.ratings.reduce((acc, rating) => acc + rating.value, 0);
    this.averageRating = total / this.ratings.length;
    this.numberOfRatings = this.ratings.length;
  } else {
    this.averageRating = 0;
    this.numberOfRatings = 0;
  }
};

// Update average rating before saving a new rating
careServiceSchema.pre('save', function(next) {
  this.calculateAverageRating();
  next();
});

const CareService = mongoose.model("CareService", careServiceSchema);

module.exports = CareService;
