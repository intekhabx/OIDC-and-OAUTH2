import ApiError from "../../common/utils/api-error.utils.js";
import asyncHandler from "../../common/utils/async-handler.utils.js";
import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import userModel from "../auth/auth.model.js";


export const verifyOauthAccessToken = asyncHandler(async(req, res, next)=>{
  // step:1 - extract access_token from header
  const authHeader = req.headers?.authorization;
  if(!authHeader || !authHeader.startsWith("Bearer ")){
    throw ApiError.unAuthorized("Bearer or access_token missing");
  }
  const token = authHeader.split(" ")[1];

  // step:2 - verify accesstoken with public key
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    throw ApiError.unAuthorized("invalid access token");
  }

  // step:3 - find the user in DB with decoded data
  const user = await userModel.findById(decoded.sub);
  if(!user){
    throw ApiError.unAuthorized("invalid access token");
  }

  req.user = {
    sub: user._id,
    name: user.name,
    email: user.email,
    aud: decoded.aud, //client_id
  }
  next();
})
