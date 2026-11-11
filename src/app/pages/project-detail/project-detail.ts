import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { SkillService } from '../../services/skill.service';
import { AuthService } from '../../services/auth.service';
import { ProjectModel } from '../../models/project.model';
import { SkillModel } from '../../models/skill.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly skillService = inject(SkillService);
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
  readonly project = signal<ProjectModel | null>(null);

  readonly projectSkills = computed<SkillModel[]>(() => {
    const current = this.project();
    if (!current) {
      return [];
    }

    return this.skillService.skills().filter(skill =>
      current.skillIds?.includes(skill.id)
    );
  });

  ngOnInit(): void {
    void this.load();
  }

  async onDelete(): Promise<void> {
    const current = this.project();
    if (!current || !this.isAuthenticated()) {
      return;
    }

    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    const deleted = await this.projectService.deleteProject(current.id);
    if (deleted) {
      await this.router.navigate(['/projects']);
    }
  }

  private async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    const [project] = await Promise.all([
      this.projectService.loadProjectById(id),
      this.skillService.skills().length === 0
        ? this.skillService.loadSkills()
        : Promise.resolve(this.skillService.skills())
    ]);

    if (!project) {
      this.notFound.set(true);
    } else {
      this.project.set(project);
    }

    this.isLoading.set(false);
  }
}
