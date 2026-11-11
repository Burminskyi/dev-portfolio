import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProjectModel } from '../models/project.model';
import { environment } from '../../environments/environment';

export type ProjectPayload = Omit<ProjectModel, 'id'>;

/*
 * =============================================================================
 * RxJS-вариант (in-memory BehaviorSubject) — как было до API
 * =============================================================================
 *
 * private projects$ = new BehaviorSubject<ProjectModel[]>(initialProjects);
 * getProjects(): Observable<ProjectModel[]> { return this.projects$.asObservable(); }
 * addProject(data) { this.projects$.next([...getValue(), newProject]); }
 *
 * Что изменилось:
 * - Данные с REST API (/api/projects)
 * - Signal-состояние + firstValueFrom вместо BehaviorSubject.next
 * - Исправлена опечатка progects$ → projects
 * =============================================================================
 */

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/projects`;

  private readonly _projects = signal<ProjectModel[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly projects = this._projects.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly projectsCount = computed(() => this._projects().length);

  getProjectById(id: string): ProjectModel | undefined {
    return this._projects().find(p => p.id === id);
  }

  async loadProjectById(id: string): Promise<ProjectModel | null> {
    const cached = this.getProjectById(id);
    if (cached) {
      return cached;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(
        this.http.get<ProjectModel>(`${this.apiUrl}/${id}`)
      );
      this._projects.update(current =>
        current.some(p => p.id === id) ? current : [...current, data]
      );
      return data;
    } catch {
      this._error.set('Failed to load project.');
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadProjects(): Promise<ProjectModel[]> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.get<ProjectModel[]>(this.apiUrl));
      this._projects.set(data);
      return data;
    } catch {
      this._error.set('Failed to load projects.');
      return [];
    } finally {
      this._isLoading.set(false);
    }
  }

  async addProject(projectData: ProjectPayload): Promise<ProjectModel | null> {
    this._error.set(null);

    try {
      const created = await firstValueFrom(
        this.http.post<ProjectModel>(this.apiUrl, projectData)
      );
      this._projects.update(current => [...current, created]);
      return created;
    } catch {
      this._error.set('Failed to create project. Are you logged in?');
      return null;
    }
  }

  async updateProject(id: string, projectData: ProjectPayload): Promise<ProjectModel | null> {
    this._error.set(null);

    try {
      const updated = await firstValueFrom(
        this.http.put<ProjectModel>(`${this.apiUrl}/${id}`, projectData)
      );
      this._projects.update(current =>
        current.map(project => (project.id === id ? updated : project))
      );
      return updated;
    } catch {
      this._error.set('Failed to update project.');
      return null;
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    this._error.set(null);

    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${projectId}`));
      this._projects.update(current => current.filter(p => p.id !== projectId));
      return true;
    } catch {
      this._error.set('Failed to delete project.');
      return false;
    }
  }
}
