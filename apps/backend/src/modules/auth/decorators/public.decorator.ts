import { SetMetadata } from "@nestjs/common";

export const PUBLIC_KEY = "randomly_generated_key_for_public_decorator";

export const Public = () => SetMetadata(PUBLIC_KEY, true);
