const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const contactFromSchema = new Schema(
  {
    name: {
        type: String,
      },
      email: {
        type: String,
        required: [true, "E-Mail ist erforderlich."],
        lowercase: true,
        trim: true,
      },
      subject: {
        type: String,
        required: [true, "Subject ist erforderlich."],
      },
    message: {
      type: String,
      required: [true, "Schreiben Sie Ihre Nachricht bitte."],
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const ContactForm = model("ContactForm", contactFromSchema);

module.exports = ContactForm;