import crypto from 'crypto';
import ApiError from '../../common/utils/api-error.utils.js';
import { buildAccessTokenPayload } from '../../common/utils/constants.utils.js';
import userModel from './auth.model.js';
import {generateAccessToken, generateRefreshToken, verifyRefreshToken} from '../../common/utils/jwt.utils.js';




const makeTokenHash = (token)=>{
  return crypto.createHash('sha256').update(token).digest('hex');
}



export const register = async ({name, email, username, password})=>{
  try {
      // step:1 - using email or username, find user exists or not
      const existing = await userModel.findOne({$or: [{email: email}, {username: username}]});
      if(existing){
        throw ApiError.conflict("user already exist");
      }
  
      // step:2 - now user doesn't exist, we create new user
      const user = await userModel.create({
        name,
        email,
        password,
        username,
      })
  
      // step:3 - send email verification
  
      // step:4 - remove sensitive field and sendback data to controller
      const userObj = user.toObject();
      delete userObj.password;
  
      return {user: userObj}
  }
  catch(error){
    throw error;
  }
}


export const login = async ({identifier, password}) =>{
  try {
    // step:1 - find user exists or not with password and refershToken && user send only username or email and password;
    const user = await userModel.findOne({$or: [{email: identifier}, {username: identifier}]}).select("+password +refreshToken");
    if(!user){
      throw ApiError.unAuthorized("invalid user credintials");
    }

    // step:2 - if username or email is right then check password
    const isMatch = await user.comparePassword(password);
    if(!isMatch) throw ApiError.unAuthorized("invalid user credintials");
    
    // step:3 - check email is verified or not

    // step:4 - generate accessToken and refreshToken
    const payload = buildAccessTokenPayload(user)
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({sub: user._id});

    // step:5 - make refreshToken hashed to store in DB
    const hashedRefreshToken = makeTokenHash(refreshToken);
    user.refreshToken = hashedRefreshToken;
    await user.save({validateBeforeSave: false}); //i know what i am storing so don't validate
    
    // step:6 - remove sensitive details and send accessToken, refreshToken and user to contoller
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return {user: userObj, accessToken, refreshToken};
  } 
  catch (error) {
    throw error;
  }
}


export const logout = async (userId)=>{
  // userId comes from isLoggedIn middleware injected req.user
  // step:1 - find user by Id and remove refershToken
  await userModel.findByIdAndUpdate(userId, {
    $unset: {refreshToken: ""}
  })

  return;
}


export const renewToken = async (refreshToken)=>{
  // step:1 - refreshToken comes form req.cookie.refreshToken , we check it is missing or not
  if(!(refreshToken && refreshToken.trim())) throw ApiError.unAuthorized("invalid or missing refresh token");

  // step:2 - verifyRefreshToken, to ensure, it is genereated through our secret
  const decoded = verifyRefreshToken(refreshToken);
  // we find user with decoded value, if user found then it is right
  const user = await userModel.findById(decoded.sub).select("+refreshToken");
  if(!user) throw ApiError.unAuthorized("invalid refresh token");

  // step:3 - make refresh token hashed to compare both refreshToken
  const hashedRefreshToken = makeTokenHash(refreshToken);
  if(hashedRefreshToken !== user.refreshToken){
    throw ApiError.unAuthorized("Invalid refresh token");
  }

  // step:4 - now user is authorized, genereate newAccessToken and newRefeshToken
  const payload = buildAccessTokenPayload(user);
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken({sub: user._id});

  // step:5 - newHashedRefreshToken store in DB
  const newHashedRefreshToken = makeTokenHash(newRefreshToken);
  user.refreshToken = newHashedRefreshToken;
  await user.save({validateBeforeSave: false});

  // step:6 - return newAccessToken and newrefreshToken to controller
  return {accessToken: newAccessToken, refreshToken: newRefreshToken};
}
