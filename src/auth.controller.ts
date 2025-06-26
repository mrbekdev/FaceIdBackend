import { Body, Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() body: { name: string; faceDescriptor: number[] }) {
        try {
            return await this.authService.register(body.name, body.faceDescriptor);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('signin')
    async signin(@Body() body: { faceDescriptor: number[] }) {
        try {
            return await this.authService.signin(body.faceDescriptor);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}