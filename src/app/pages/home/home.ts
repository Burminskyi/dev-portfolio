import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AboutService } from '../../services/about.service';
import { SkillService } from '../../services/skill.service';
import { ProjectService } from '../../services/project.service';
import { ProjectModel } from '../../models/project.model';
import { SkillModel } from '../../models/skill.model';

interface ProjectWithSkills extends ProjectModel {
  skills: SkillModel[];
}

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private readonly aboutService = inject(AboutService);
  private readonly skillService = inject(SkillService);
  private readonly projectService = inject(ProjectService);

  readonly about = this.aboutService.about;
  readonly isAboutLoading = this.aboutService.isLoading;
  readonly aboutError = this.aboutService.error;

  readonly skills = this.skillService.skills;
  readonly projects = this.projectService.projects;

  readonly isCatalogLoading = computed(
    () => this.skillService.isLoading() || this.projectService.isLoading()
  );

  readonly projectsWithSkills = computed<ProjectWithSkills[]>(() => {
    const skills = this.skills();
    return this.projects().map(project => ({
      ...project,
      skills: skills.filter(skill => project.skillIds?.includes(skill.id))
    }));
  });

  ngOnInit(): void {
    void Promise.all([
      this.aboutService.loadAbout(),
      this.skillService.loadSkills(),
      this.projectService.loadProjects()
    ]);
  }
}
