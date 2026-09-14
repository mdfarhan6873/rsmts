import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { AuthService } from './src/auth/auth.service.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  try {
    const res = await authService.login({ email: 'admin@gmail.com', password: 'password@123' });
    console.log('Login success!', res);
  } catch (error) {
    console.error('Login error:', error);
  }

  await app.close();
}

bootstrap().then(() => process.exit(0));
