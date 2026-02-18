import { IsArray, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { ThreadProperty } from "./thread.type";

export class ThreadGetDto {
  @ApiPropertyOptional({
    description: "Propriétés à retourner",
    type: [String],
    example: ["id", "emailIds"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  properties?: ThreadProperty[];
}
