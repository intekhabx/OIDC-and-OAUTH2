import * as z from 'zod';

const signOutUserDto = z.object({
  refresh_token: z.string().min(1, "refresh_token is required")
})

export default signOutUserDto;