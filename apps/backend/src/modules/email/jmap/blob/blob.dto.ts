import { IsArray, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class BlobCopyDto {
  @ApiProperty({ description: "Compte source" })
  @IsString()
  @IsNotEmpty()
  fromAccountId: string;

  @ApiProperty({ description: "Compte destination" })
  @IsString()
  @IsNotEmpty()
  toAccountId: string;

  @ApiProperty({ description: "IDs des blobs à copier" })
  @IsArray()
  @IsString({ each: true })
  blobIds: string[];
}
