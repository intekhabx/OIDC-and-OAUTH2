import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "name is required"],
    minlength: 2,
    maxlength: 95
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    required: [true, "email is required"],
    maxlength: 322
  },
  username: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: [true, "username is required"],
    minlength: 2,
    maxlength: 55
  },
  password: {
    type: String,
    required: [true, "password is required"],
    minlength: 8,
    maxlength: 66,
    select: false,
  },
  role:{
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String,
    select: false,
  },
  verificationToken: {type: String, select: false},
  resetPasswordToken: {type: String, select: false},
  resetPasswordTokenExpires: {type: Date, select: false},
}, {timestamps: true})


//save hased password in db whenever password field will modify
userSchema.pre('save', async function(){
  if(!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
})

//method to compare plain and hashedPassword
userSchema.methods.comparePassword = async function(plainTextPassword){
  return await bcrypt.compare(plainTextPassword, this.password);
}


const userModel = mongoose.model('User', userSchema);
export default userModel;