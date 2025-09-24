import { HttpErrorResponse } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorMessageService } from '../services/error-message.service';
import { inject } from '@angular/core';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const errorMessageService = inject(ErrorMessageService);
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = error.error.message;
            errorMessageService.showError(errorMessage);
            return throwError(() => ({ status: error.status, message: errorMessage }));
        })
    );
};