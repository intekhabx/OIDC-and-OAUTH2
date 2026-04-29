import * as z from 'zod';

const loginDto = z.object({
    identifier: z.string({
      required_error: "email or username is required",
    })
    .min(2, "email or username is required")
    .trim()
    .toLowerCase(),

    password: z.string().min(8, "password should be 8 character minimum").max(66).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, "password should contain capital, small number and a special character"),
  });


export default loginDto;