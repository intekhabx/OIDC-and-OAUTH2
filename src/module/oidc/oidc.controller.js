import path from 'path';
import crypto from 'crypto';
import asyncHandler from "../../common/utils/async-handler.utils.js";
import ApiError from '../../common/utils/api-error.utils.js';
import ApiResponse from '../../common/utils/api-response.utils.js';
import {applicationModel, clientTokenModel, consentModel} from './oidc.model.js';
import { jwks } from '../../common/config/key.config.js';
import userModel from '../auth/auth.model.js';
import {generateAccessToken, generateRefreshToken, verifyRefreshToken} from '../../common/utils/jwt.utils.js'
import { redis } from '../../common/config/redis.config.js';
import { buildAccessTokenPayload } from '../../common/utils/constants.utils.js';



function generateClientIdAndSecret(){
  const clientId = crypto.randomUUID();
  const clientSecret = crypto.randomBytes(32).toString('hex');
  return {clientId, clientSecret};
}

function makeDataHash(data){
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function verifyToken(refresh_token){
  // step:1 - validate the refresh_token
  if(!refresh_token){
    throw ApiError.badRequest("missing refresh_token")
  }
  // step:2 - verify client refresh_token that token created by our private key or not
  let decoded;
  try {
    decoded = verifyRefreshToken(refresh_token);
  } catch (err) {
    throw ApiError.unAuthorized("invalid refresh token");
  }
  // step:3 - verify user exists or not in DB
  const user = await userModel.findById(decoded.sub);
  if(!user){
    throw ApiError.unAuthorized("user not found");
  }

  // step:4 - verify the refresh_token with clientTokenModel
  const hashed = makeDataHash(refresh_token);
  const storedToken = await clientTokenModel.findOne({refreshToken: hashed})
  if(!storedToken){
    throw ApiError.unAuthorized("refresh token revoked");
  }

  return {userId: user._id}
}

async function verifyShortCode(code) {
  // step:1 - verify the shortCode in redis
  const shortCode = await redis.get(`shortcode:${code}`);
  if(!shortCode){
    throw ApiError.unAuthorized("invalid or expired code");
  }

  // step:2 - if everything is valid then parse the json and extract userId from shortcode
  const {userId} = JSON.parse(shortCode);
  // delete the sort code from redis because it is one time use only
  await redis.del(`shortcode:${code}`);

  return { userId };
}


export const wellKnownController = asyncHandler(async (_, res)=>{
  const baseURL = process.env.ISSUER_URL;
  res.status(200).json({
    issuer: `${baseURL}`,
    authorization_endpoint: `${baseURL}/oidc/oauth2/authorize`,
    userinfo_endpoint: `${baseURL}/oidc/oauth2/userinfo`,
    token_endpoint: `${baseURL}/oidc/oauth2/token`,
    jwks_uri: `${baseURL}/oidc/oauth2/certs`,
    revocation_endpoint: `${baseURL}/logout`,
    developer_console: `${baseURL}/api/developer-console`,
    response_types_supported: ["code"],
    response_modes_supported: ["query", "form_post"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "email", "profile"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    claims_supported: [
      "sub",
      "email",
      "username",
      "name",
      "role",
      "aud",
      "iss"
    ],
    grant_types_supported: ["authorization_code", "refresh_token", 
      // "jwt_bearer"
    ]
  })
})


export const getPublicKey = asyncHandler(async (req, res)=>{
  res.status(200).json({jwks});
})


export const renderAuthentictePage = asyncHandler(async (req, res)=>{
  const {redirect_url, state, client_id} = req?.query;
  const query = `redirect_url=${redirect_url}&client_id=${client_id}&state=${state}`;
  res.status(200).redirect(`/authenticate.html?${query}`)
})

export const renderRegisterApplicationPage = asyncHandler(async(req, res)=>{
  res.status(200).redirect('/application.html')
})

export const registerApplication = asyncHandler(async (req, res)=>{
  // step:1 - extract application data and check already registered or not
  const {name, url, redirect_url} = req.body;

  const isRegistered = await applicationModel.findOne({$or: [{url}, {redirectUrl: redirect_url}]});
  if(isRegistered){
    throw ApiError.conflict("application already registered");
  }

  // step:2 - create clientId and clientSecret for application
  const {clientId, clientSecret} = generateClientIdAndSecret();
  const hashedClientSecret = makeDataHash(clientSecret);

  // step:3 - now, add this application in DB
  await applicationModel.create({
    name,
    url,
    redirectUrl: redirect_url,
    clientId,
    clientSecret: hashedClientSecret,
  })

  // step:4 - return clientId and clientSecret to the application owner
  ApiResponse.created(res, "application registered successfully", {clientId, clientSecret});
})


export const showUserConsentPage = asyncHandler(async (req, res)=>{
  // step:1 - extract all details from query
  const {redirect_url, client_id, state} = req?.query;
  const query = `redirect_url=${redirect_url}&client_id=${client_id}&state=${state}`;

  // step:2 - if anyone is missing
  if(!redirect_url || !client_id || !state){
    return res.status(302).redirect(`/error.html?${query}`);
    // throw ApiError.unAuthorized("invalid or missing query parameters");
  }

  // step:3 - check applitaction is registered or not
  // const app = await applicationModel.findOne({$and: [{redirectUrl: redirect_url}, {clientId: client_id}]}); //explicity and likhne ki jaroorat nhi hoti but ye v sahi hai
  const app = await applicationModel.findOne({redirectUrl: redirect_url, clientId: client_id});

  if(!app){
    return res.status(302).redirect(`/error.html?${query}`);
    // throw ApiError.unAuthorized("invalid query parameters");
  }

  // step:4 check user is logged-in or not with long lived refresh-token 
  const refreshToken = req?.cookies?.refreshToken;
  if(!refreshToken){
    return res.status(302).redirect(`/oidc/oauth2/authenticate?${query}`);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return res.redirect(302, `/oidc/oauth2/authenticate?${query}`);
  }

  const user = await userModel.findById(decoded.sub).select("+refreshToken");
  if(!user){
    return res.redirect(302, `/oidc/oauth2/authenticate?${query}`);
  }

  const hashedRefreshToken = makeDataHash(refreshToken);
  if(user.refreshToken !== hashedRefreshToken){
    return res.status(302).redirect(`/oidc/oauth2/authenticate?${query}`);
  }

  // step:5 - now user and app is authenticated and logged-in then show the consent page
  // add app and user_data and state in redis to show on consent page
  const consentId = crypto.randomUUID();
  await redis.set(`consent:${consentId}`, JSON.stringify({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    appName: app.name,
    client_id: app.clientId,
    state,
    redirect_url,
  }), "EX", 60 * 15);//15min

  res.status(302).redirect(`/consent.html?consent_id=${consentId}`);
})


export const getUserAndAppDetails = asyncHandler(async (req, res)=>{
  // step:1 - user will came with consentId
  const {consent_id} = req?.query;
  if(!consent_id){
    return res.status(400).redirect('/error.html');
  }

  //step:2 - get details in redis and send to consent page
  const data = await redis.get(`consent:${consent_id}`);

  if (!data) {
    return res.status(400).redirect('/error.html');
    // return res.status(400).json({ error: "Consent expired" });
  }

  // step:3 - parse the data that is coming from redis because data is stored in string in redis
  let parsedData;
  try {
    parsedData = JSON.parse(data)
  } catch (err) {
    return res.status(500).redirect("/error.html");
  }

  // step:4 - verify the user, request is authentic or not with refreshToken
  const refreshToken = req?.cookies?.refreshToken;
  const decoded = verifyRefreshToken(refreshToken);

  if(decoded.sub !== parsedData.userId.toString()){
    return res.status(403).redirect("/error.html");
  }

  // step:5 - send user and application details to consent page
  res.status(200).json({
    userName: parsedData.userName,
    userEmail: parsedData.userEmail,
    appName: parsedData.appName,
    // state: parsedData.state
  });
})



export const acceptConsent = asyncHandler(async(req, res)=>{
  // step:1 - now user give his consent, extract consent_id
  const {consent_id} = req.body;

  // step:2 - find data in redis with consent_id
  const data = await redis.get(`consent:${consent_id}`);
  if (!data) {
    return res.status(400).redirect("/error.html");
  }
  const parsedRedisData = JSON.parse(data);

  // step:3 - store consent in DB and delete from redis
  await consentModel.create({
    granted: true,
    scope: ["openid", "profile", "email"]
  })
  await redis.del(`consent:${consent_id}`);
  
  // step:4 generateShortCode and store in redis with userId and client_id
  const shortCode = crypto.randomBytes(16).toString('hex');

  await redis.set(`shortcode:${shortCode}`, JSON.stringify({
    userId: parsedRedisData.userId,
    client_id: parsedRedisData.client_id,
    redirect_url: parsedRedisData.redirect_url
  }), "EX", 300) //5min
  
  // step:5 - redirect user to redirect_url with shortCode and state
  res.status(302).redirect(`${parsedRedisData.redirect_url}?code=${shortCode}&state=${parsedRedisData.state}`);
})



export const denyConsent = asyncHandler(async(req, res)=>{
  // step:1 - now user deny his consent, so extract consent_id
  const {consent_id} = req.body;

  // step:2 - extract redirect_url and state from redis before delete it
  const data = await redis.get(`consent:${consent_id}`);
  if(!data){
    return res.status(400).redirect("/error.html");
  }

  const parsedRedisData = JSON.parse(data);

  // step:3 - delete (application details and user details)-consent from redis
  await redis.del(`consent:${consent_id}`);
  
  // step:4 - redirect user to redirct_url with error_message and state
  res.status(302).redirect(`${parsedRedisData.redirect_url}?error_message=user-denied-consent&state=${parsedRedisData.state}`)
})



export const getOrRenewClientAccessAndRefreshToken = asyncHandler(async(req, res)=>{
  //client came with client_id, client_secret, short code and grant_type (shortcode || refresh_token)
  // step:1 - extract client_id client_secret short code and grant_type and refresh_token
  const {client_id, client_secret, code, grant_type, refresh_token} = req.body;

  if(grant_type !== "authorization_code" && grant_type !== "refresh_token"){
    throw ApiError.badRequest("grant_type should be either authorization_code or refresh_token");
  }

  // step:2 - verify client_id and client_secret
  const app = await applicationModel.findOne({clientId: client_id}).select("+clientSecret");
  if(!app){
    throw ApiError.unAuthorized("missing or invalid client_id and client_secret");
  }

  // step:3 - verify client_secret with hashed clientSecret
  const hashedClientSecret = makeDataHash(client_secret);
  if(app.clientSecret !== hashedClientSecret){
    throw ApiError.unAuthorized("invalid or missing client_id and client_secret");
  }

  // step:4 - generate or renew token based on shortcode || refresh_token
  let userId;
  // generate the token for first time user
  if(grant_type === "authorization_code"){
    ({userId} = await verifyShortCode(code));
  }
  // refresh the token after access_token expires
  else if(grant_type === "refresh_token"){
    ({userId} = await verifyToken(refresh_token));
  }

  // step:5 - access user details to make tokens
  const user = await userModel.findById(userId);
  if(!user){
    throw ApiError.unAuthorized("user doesn't exist");
  }

  // step:6 - generate accessToken and refreshToken for the client and send to client
  const payload = buildAccessTokenPayload(user, app.clientId);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({sub: user._id});

  // step:7 - store hased refreshToken of client user in db
  const hashedRefreshToken = makeDataHash(refreshToken);
  await clientTokenModel.create({
    refreshToken: hashedRefreshToken
  })

  ApiResponse.ok(res, "tokens generated successfully", {accessToken, refreshToken, tokenType: "Bearer"});

// furture improvement: PKCE-implementation
})


