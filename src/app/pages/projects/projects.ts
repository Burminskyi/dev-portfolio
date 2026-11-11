import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { SkillService } from '../../services/skill.service';
import { AuthService } from '../../services/auth.service';
import { ProjectModel } from '../../models/project.model';
import { ProjectFormComponent } from '../../components/projects/project-form/project-form';
import { SkillModel } from '../../models/skill.model';

export interface ProjectWithSkills extends ProjectModel {
  skills: SkillModel[];
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ProjectFormComponent, RouterLink],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class Projects implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly skillService = inject(SkillService);
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly isLoading = computed(
    () => this.projectService.isLoading() || this.skillService.isLoading()
  );
  readonly error = computed(
    () => this.projectService.error() ?? this.skillService.error()
  );

  readonly projectsWithSkills = computed<ProjectWithSkills[]>(() => {
    const projects = this.projectService.projects();
    const skills = this.skillService.skills();

    return projects.map(project => ({
      ...project,
      skills: skills.filter(skill => project.skillIds?.includes(skill.id))
    }));
  });

  ngOnInit(): void {
    void Promise.all([
      this.projectService.loadProjects(),
      this.skillService.loadSkills()
    ]);
  }

  async onDeleteProject(event: Event, id: string): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isAuthenticated()) {
      return;
    }

    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    await this.projectService.deleteProject(id);
  }
}
