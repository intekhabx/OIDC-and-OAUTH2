import asyncHandler from '../../common/utils/async-handler.utils.js';
import userModel from './auth.model.js';
import ApiError from '../../common/utils/api-error.utils.js';
import {verifyAccessToken} from '../../common/utils/jwt.utils.js'



export const isLoggedIn = asyncHandler(async (req, res, next)=>{
  // step:1 - extract bearer token from header
  const authHeader = req.headers?.authorization;

  let token;
  if(authHeader && authHeader.startsWith("Bearer ")){
    token = authHeader.split(" ")[1];
  } else{
    token = req.cookies?.accessToken; // if frontend would may send token on cookie
  }

  if(!token) throw ApiError.badRequest("invalid or missing token");

  // step:2 - verify the token and find user with decoded value
  const decoded = verifyAccessToken(token);
  const user = await userModel.findById(decoded.sub);
  if(!user) throw ApiError.unAuthorized("invalid access token");

  // step:3 - now user is authenticated, attach user details on req.user
  req.user = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role
  }
  next();
})