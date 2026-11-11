import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SkillService } from '../../../services/skill.service';

@Component({
  selector: 'app-skill-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './skill-form.html',
  styleUrl: './skill-form.scss'
})
export class SkillFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly skillService = inject(SkillService);

  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly skillForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    category: ['Backend', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    level: ['intermediate', Validators.required]
  });

  hasError(controlName: string, errorCode?: string): boolean {
    const control = this.skillForm.get(controlName);
    if (!control || !(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  async onSubmit(): Promise<void> {
    if (this.skillForm.invalid) {
      this.skillForm.markAllAsTouched();
      this.formError.set('Please fill in all required fields correctly.');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    const created = await this.skillService.addSkill({
      title: this.skillForm.value.title,
      category: this.skillForm.value.category,
      description: this.skillForm.value.description,
      level: this.skillForm.value.level,
      projectIds: []
    });

    this.isSubmitting.set(false);

    if (!created) {
      this.formError.set(this.skillService.error() ?? 'Could not create skill. Login required.');
      return;
    }

    this.skillForm.reset({
      category: 'Backend',
      level: 'intermediate'
    });
  }
}
