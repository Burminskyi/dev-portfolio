import { Component, inject, OnInit } from '@angular/core';
import { SkillFormComponent } from '../../components/skills/skill-form/skill-form';
import { SkillService } from '../../services/skill.service';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [SkillFormComponent],
  standalone: true,
  selector: 'app-skills',
  styleUrl: './skills.scss',
  templateUrl: './skills.html',
})
export class Skills implements OnInit {
  private readonly skillService = inject(SkillService);
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly skills = this.skillService.skills;
  readonly isLoading = this.skillService.isLoading;
  readonly error = this.skillService.error;

  ngOnInit(): void {
    void this.skillService.loadSkills();
  }

  async onDeleteSkill(id: string): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }

    if (!confirm('Delete this skill?')) {
      return;
    }

    await this.skillService.deleteSkill(id);
  }
}
