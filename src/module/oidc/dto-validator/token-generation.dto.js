import { z } from "zod";

const getOrRenewTokensDto = z.object({
    client_id: z.string(),
    client_secret: z.string(),
    grant_type: z.string(),

    code: z.string().optional(),
    refresh_token: z.string().optional(),
  })
  .refine(
    (data) =>
      !!data.code !== !!data.refresh_token,
    {
      message:
        "Provide either code or refresh_token, but not both",
    }
  );


export default getOrRenewTokensDto;
