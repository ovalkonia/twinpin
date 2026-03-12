export class CreateUserDto {
  email: string;      
  password: string;     
  fullName: string;    
  role?: string;        
  isVisibleInVisitorList?: boolean; 
}