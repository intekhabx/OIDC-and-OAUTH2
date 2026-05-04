import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: ["true", "application name is required"],
    minlength: 2,
    maxlength: 100,
    trim: true
  },
  url: {
    type: String,
    required: ["true", "application url is required"],
    unique: true,
    trim: true
  },
  redirectUrl: {
    type: String,
    required: ["true", "redirect url is required"],
    unique: true,
    trim: true
  },
  clientId: {
    type: String,
    required: true,
    unique: true,
  },
  clientSecret: {
    type: String,
    required: true,
    select: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {timestamps: true});


export const applicationModel = mongoose.model("Application", applicationSchema);
