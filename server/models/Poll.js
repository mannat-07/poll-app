const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema({
  question: { 
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  options: [
    {
      text: {
        type: String,
        required: true,
        maxlength: 100,
        trim: true
      },
      votes: { 
        type: Number,
        default: 0,
        min: 0
      }
    }
  ],
  voters: [String], // IP addresses to prevent duplicate voting
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Poll", pollSchema);
