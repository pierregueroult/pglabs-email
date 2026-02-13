import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CreateMailboxDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class RenameMailboxDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class MoveEmailDto {
    @IsString()
    @IsNotEmpty()
    targetMailboxId: string;
}

export class SetReadStatusDto {
    @IsBoolean()
    isRead: boolean;
}

export class SetFlagStatusDto {
    @IsBoolean()
    isFlagged: boolean;
}
