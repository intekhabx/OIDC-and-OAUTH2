import ApiError from "../../common/utils/api-error.utils.js";
import asyncHandler from "../../common/utils/async-handler.utils.js";
import { verifyAccessToken, verifyRefreshToken } from "../../common/utils/jwt.utils.js";
import userModel from "../auth/auth.model.js";
import { makeDataHash } from "./oidc.controller.js";


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



export const authenticateUserWithRefreshToken = asyncHandler(async(req, res, next)=> {
  //check user is logged-in or not with long lived refresh-token

  // step:1 - extract all details from query
  const {redirect_url, client_id, state} = req?.query;
  const query = `redirect_url=${redirect_url}&client_id=${client_id}&state=${state}`;

  // step:2 - extract refresh-token from cookies
  const refreshToken = req?.cookies?.refreshToken;
  if(!refreshToken){
    return res.status(302).redirect(`/oidc/oauth2/authenticate?${query}`);
  }

  // step:3 - verify refresh-token 
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return res.redirect(302, `/oidc/oauth2/authenticate?${query}`);
  }

  // step:4 - find user details using decoded data
  const user = await userModel.findById(decoded.sub).select("+refreshToken");
  if(!user){
    return res.redirect(302, `/oidc/oauth2/authenticate?${query}`);
  }

  // step:5 - compare db refreshtoken and cookie-refresh-token
  const hashedRefreshToken = makeDataHash(refreshToken);
  if(user.refreshToken !== hashedRefreshToken){
    return res.status(302).redirect(`/oidc/oauth2/authenticate?${query}`);
  }

  next();
})
