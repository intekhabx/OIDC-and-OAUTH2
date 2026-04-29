import asyncHandler from '../../common/utils/async-handler.utils.js';
import * as authService from './auth.service.js';
import ApiResponse from '../../common/utils/api-response.utils.js';


export const register = asyncHandler(async (req, res)=>{
  const user = await authService.register(req.body);
  ApiResponse.created(res, "user registered successfully", user);
})


export const login = asyncHandler(async (req, res)=>{
  const {user, accessToken, refreshToken} = await authService.login(req.body);

  //send accessToken and user detials to client by response and send refreshToken by httpOnly cookie
      res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 //7days
    })

    ApiResponse.ok(res, "user logged-in success", {user, accessToken});
})


export const logout = asyncHandler(async (req, res)=>{
  await authService.logout(req.user?.id);
  
  // step:1 - clear refreshToken in cookie and send response
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  ApiResponse.ok(res, "user logged-out");
})


export const renewToken = asyncHandler(async (req, res)=>{
  const {accessToken, refreshToken} = await authService.renewToken(req.cookies?.refreshToken);

  // send newRefreshToken in cookie and newAccessToken as response
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 //7days
  })

  ApiResponse.ok(res, "access and refresh token renewed", accessToken);
})
