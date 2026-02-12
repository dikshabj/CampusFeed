import {Role} from '../common/roles.enum';

export class User {
    id : number;
    email : string;
    password : string;
    role : Role;
    branch : string;
    semester : number;

    //only for student
    rollNumber?: string;

    //only for faculty
    facultyId?: string;

    profileImageUrl?: string;

    createdAt?: Date;
}