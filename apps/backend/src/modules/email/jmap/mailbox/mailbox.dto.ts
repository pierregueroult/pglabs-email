import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { MailboxProperty, MailboxRole } from "./mailbox.type";

export class MailboxQueryDto {
  @ApiPropertyOptional({ description: "ID du parent (null = racine)" })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional({ description: "Recherche sur le nom" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Filtre sur le rôle", example: "inbox" })
  @IsOptional()
  @IsString()
  role?: MailboxRole;

  @ApiPropertyOptional({ description: "Position de départ pour la pagination" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  position?: number;

  @ApiPropertyOptional({ description: "Nombre max de résultats" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: "Inclure le total" })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  calculateTotal?: boolean;

  @ApiPropertyOptional({ description: "Trier en arbre hiérarchique" })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  sortAsTree?: boolean;
}

export class MailboxGetDto {
  @ApiPropertyOptional({
    description: "Propriétés à retourner",
    type: [String],
    example: ["id", "name", "role", "unreadEmails", "totalEmails"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  properties?: MailboxProperty[];
}

export class MailboxCreateDto {
  @ApiProperty({ description: "Nom de la mailbox" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "ID du parent (null = racine)" })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional({ description: "Rôle JMAP", example: "archive" })
  @IsOptional()
  @IsString()
  role?: MailboxRole;

  @ApiPropertyOptional({ description: "Ordre de tri (nombre)", default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ description: "Abonné à la mailbox" })
  @IsOptional()
  @IsBoolean()
  isSubscribed?: boolean;
}

export class MailboxUpdateDto {
  @ApiProperty({ description: "ID de la mailbox à modifier" })
  @IsString()
  id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSubscribed?: boolean;
}

export class MailboxDeleteDto {
  @ApiProperty({ description: "IDs des mailboxes à supprimer" })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiPropertyOptional({ description: "Supprimer aussi les emails dedans" })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  onDestroyRemoveEmails?: boolean;
}
