import {Role} from '../../common/roles.enum';
export class RegisterDto{
    email : string;
    password : string;
    role : Role;
    branch : string;
    semester : number;

    rollNumber?: string;
    facultyId? : string;
}