import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AboutService } from '../../services/about.service';
import { AboutModel } from '../../models/about.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly aboutService = inject(AboutService);

  readonly isLoading = this.aboutService.isLoading;
  readonly about = this.aboutService.about;

  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly formSuccess = signal<string | null>(null);
  readonly avatarPreview = signal<string | null>(null);

  readonly profileForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    title: ['', [Validators.required, Validators.minLength(2)]],
    bio: ['', [Validators.required, Validators.minLength(10)]],
    location: ['', [Validators.required]],
    avatarUrl: [''],
    telegramUrl: [''],
    githubUrl: [''],
    linkedinUrl: ['']
  });

  ngOnInit(): void {
    void this.initForm();
  }

  hasError(controlName: string, errorCode?: string): boolean {
    const control = this.profileForm.get(controlName);
    if (!control || !(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.formError.set('Please select an image file.');
      return;
    }

    // Keep payload reasonable for JSON/Base64 storage
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.formError.set('Image is too large. Max size is 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      this.profileForm.patchValue({ avatarUrl: dataUrl });
      this.avatarPreview.set(dataUrl);
      this.formError.set(null);
    };
    reader.onerror = () => {
      this.formError.set('Failed to read the image file.');
    };
    reader.readAsDataURL(file);
  }

  clearAvatar(): void {
    this.profileForm.patchValue({ avatarUrl: '' });
    this.avatarPreview.set(null);
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.formError.set('Please fill in all required fields correctly.');
      this.formSuccess.set(null);
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);
    this.formSuccess.set(null);

    const value = this.profileForm.getRawValue();
    const payload: AboutModel = {
      fullName: value.fullName,
      title: value.title,
      bio: value.bio,
      location: value.location,
      avatarUrl: value.avatarUrl || '/assets/avatar.png',
      socialLinks: {
        telegramUrl: value.telegramUrl || undefined,
        githubUrl: value.githubUrl || undefined,
        linkedinUrl: value.linkedinUrl || undefined
      }
    };

    const updated = await this.aboutService.updateAbout(payload);
    this.isSubmitting.set(false);

    if (!updated) {
      this.formError.set(this.aboutService.error() ?? 'Failed to save profile.');
      return;
    }

    this.formSuccess.set('Profile saved successfully.');
    this.avatarPreview.set(updated.avatarUrl || null);
  }

  private async initForm(): Promise<void> {
    const data = this.about() ?? (await this.aboutService.loadAbout());
    if (!data) {
      return;
    }

    this.profileForm.patchValue({
      fullName: data.fullName,
      title: data.title,
      bio: data.bio,
      location: data.location,
      avatarUrl: data.avatarUrl,
      telegramUrl: data.socialLinks.telegramUrl ?? '',
      githubUrl: data.socialLinks.githubUrl ?? '',
      linkedinUrl: data.socialLinks.linkedinUrl ?? ''
    });

    this.avatarPreview.set(data.avatarUrl || null);
  }
}
