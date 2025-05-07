import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: String | null = null;
  registrado: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required]]
    },
      {
        validators: this.contrasenasIguales('contrasena', 'confirmarContrasena')
      });
  }

  contrasenasIguales(pass1: string, pass2: string) {
    return (formGroup: FormGroup) => {
      const pass1Control = formGroup.get(pass1);
      const pass2Control = formGroup.get(pass2);

      if (pass1Control?.value !== pass2Control?.value) {
        pass2Control?.setErrors({ noCoincide: true });
      } else {
        pass2Control?.setErrors(null);
      }
    };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Por favor, rellena todos los campos requeridos';
      return;
    }

    this.authService.registro(this.registerForm.value).subscribe({
      next: () => {
        this.registrado = true;
        this.errorMessage = '';
        this.registerForm.reset();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Error en el registro';
        }
      }
    });
  }

  get f() {
    return this.registerForm.controls;
  }
}
