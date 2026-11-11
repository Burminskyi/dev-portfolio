import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';
import { SkillService } from '../../../services/skill.service';

@Component({
  imports: [ReactiveFormsModule],
  standalone: true,
  selector: 'app-project-form',
  styleUrl: './project-form.scss',
  templateUrl: './project-form.html',
})
export class ProjectFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly skillService = inject(SkillService);

  readonly skills = this.skillService.skills;
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly projectForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    link: [''],
    skillIds: [[] as string[]]
  });

  ngOnInit(): void {
    if (this.skills().length === 0) {
      void this.skillService.loadSkills();
    }
  }

  hasError(controlName: string, errorCode?: string): boolean {
    const control = this.projectForm.get(controlName);
    if (!control || !(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  isSkillSelected(skillId: string): boolean {
    const selected = this.projectForm.value.skillIds as string[];
    return selected?.includes(skillId) ?? false;
  }

  toggleSkill(skillId: string): void {
    const current = [...((this.projectForm.value.skillIds as string[]) ?? [])];
    const index = current.indexOf(skillId);

    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(skillId);
    }

    this.projectForm.patchValue({ skillIds: current });
  }

  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.formError.set('Please fill in all required fields correctly.');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    const created = await this.projectService.addProject({
      title: this.projectForm.value.title,
      description: this.projectForm.value.description,
      link: this.projectForm.value.link || undefined,
      skillIds: this.projectForm.value.skillIds ?? []
    });

    this.isSubmitting.set(false);

    if (!created) {
      this.formError.set(this.projectService.error() ?? 'Could not create project. Login required.');
      return;
    }

    this.projectForm.reset({
      skillIds: []
    });
  }
}
