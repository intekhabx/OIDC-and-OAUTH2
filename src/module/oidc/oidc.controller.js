import path from 'path';
import crypto from 'crypto';
import asyncHandler from "../../common/utils/async-handler.utils.js";
import ApiError from '../../common/utils/api-error.utils.js';
import ApiResponse from '../../common/utils/api-response.utils.js';
import {applicationModel} from './oidc.model.js';
import { jwks } from '../../common/config/key.config.js';



function generateClientIdAndSecret(){
  const clientId = crypto.randomUUID();
  const clientSecret = crypto.randomBytes(32).toString('hex');
  return {clientId, clientSecret};
}

function makeDataHash(data){
  return crypto.createHash('sha256').update(data).digest('hex');
}


export const wellKnownController = asyncHandler(async (_, res)=>{
  const baseURL = process.env.ISSUER_URL;
  res.status(200).json({
    issuer: `${baseURL}`,
    authorization_endpoint: `${baseURL}/oidc/oauth2/authenticate`,
    userinfo_endpoint: `${baseURL}/oidc/oauth2/userinfo`,
    token_endpoint: `${baseURL}/token`,
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
    grant_types_supported: ["authorization_code", "refresh_token", "jwt_bearer"]
  })
})


export const getPublicKey = asyncHandler(async (req, res)=>{
  res.status(200).json({jwks});
})


export const renderAuthentictePage = asyncHandler(async (req, res)=>{
  res.status(200).redirect('/authenticate.html')
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