import * as z from 'zod';

const registerApplicationDto = z.object({
  name: z.string().min(2, "minimum length should be 2").max(299).trim(),
  url: z.string().trim(),
  redirect_url: z.string().trim()
})

export default registerApplicationDto;