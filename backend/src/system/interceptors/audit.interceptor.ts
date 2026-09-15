import mongoose from 'mongoose';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: mongoose.Model<AuditLogDocument>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const url = request.url;
    
    // We only log state-modifying requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap({
          next: () => {
            const userEmail = request.user?.email || 'System';
            let action = `${method} ${url.split('?')[0]}`;
            
            // Generate more human-readable actions if possible
            if (url.includes('/users') && method === 'POST') action = 'REGISTER_USER';
            if (url.includes('/users') && method === 'PUT') action = 'UPDATE_USER';
            if (url.includes('/assets/register') && method === 'POST') action = 'REGISTER_ASSET';
            if (url.includes('/assets') && method === 'PUT') action = 'UPDATE_ASSET';
            if (url.includes('/movements') && method === 'POST') action = 'ROUTE_ASSET';
            
            this.auditLogModel.create({
              userEmail,
              action,
              method,
              url,
              statusCode: response.statusCode,
              payload: request.body && Object.keys(request.body).length > 0 ? request.body : null,
            }).catch(err => {
              console.error('Failed to save audit log:', err);
            });
          },
          error: (err) => {
            const userEmail = request.user?.email || 'System';
            let action = `${method} ${url.split('?')[0]}`;
            
            this.auditLogModel.create({
              userEmail,
              action,
              method,
              url,
              statusCode: err.status || 500,
              payload: request.body && Object.keys(request.body).length > 0 ? request.body : null,
            }).catch(e => {
              console.error('Failed to save audit log error:', e);
            });
          }
        })
      );
    }
    
    return next.handle();
  }
}

