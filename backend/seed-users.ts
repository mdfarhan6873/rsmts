import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { UsersService } from './src/users/users.service.js';
import { UserRole } from './src/users/schemas/user.schema.js';

async function bootstrap() {
  console.log('Initializing application context for seeding users...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const admin = await usersService.create({
      name: 'System Admin',
      email: 'admin@gmail.com',
      password: 'password@123',
      role: UserRole.SYSTEM_ADMIN,
      isActive: true,
    });
    console.log('Successfully seeded admin user:', admin.email);
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('Admin user already exists. Updating password to password@123...');
      // To ensure they can login with password@123 even if it existed with another password:
      const existing = await usersService.findByEmailWithPassword('admin@gmail.com');
      if (existing) {
        await usersService.update(existing._id.toString(), {
          password: 'password@123'
        });
        console.log('Admin user password successfully reset to password@123');
      }
    } else {
      console.error('Error seeding admin user:', error);
    }
  }

  await app.close();
}

bootstrap().then(() => process.exit(0));
