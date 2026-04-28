import * as z from 'zod';

export const loginDto = z.object({
    email: z.string().email("invalid email address").max(322).trim().lowercase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "invalid email format"),

    password: z.string().min(8, "password should be 8 character minimum").max(66).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, "password should contain capital, small number and a special character"),

    username: z.string().min(2).max(55).lowercase().trim().regex(/^[a-z0-9_]{3,20}$/, "invalid username"),
  });


export default loginDto;