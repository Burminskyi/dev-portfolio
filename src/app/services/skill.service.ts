import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SkillModel } from '../models/skill.model';
import { environment } from '../../environments/environment';

export type SkillPayload = Omit<SkillModel, 'id'>;

/*
 * =============================================================================
 * RxJS-вариант (in-memory BehaviorSubject) — как было до API
 * =============================================================================
 *
 * private skills$ = new BehaviorSubject<SkillModel[]>(initialSkills);
 * getSkills(): Observable<SkillModel[]> { return this.skills$.asObservable(); }
 * addSkill(data) { this.skills$.next([...this.skills$.getValue(), newSkill]); }
 *
 * Что изменилось:
 * - Источник данных: REST API (GET/POST/PUT/DELETE /api/skills), не мок-массив
 * - Состояние в signal; HTTP Observable → firstValueFrom → signal.set/update
 * - Компоненты вызывают loadSkills() в ngOnInit / после мутаций
 * =============================================================================
 */

@Injectable({ providedIn: 'root' })
export class SkillService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/skills`;

  private readonly _skills = signal<SkillModel[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly skills = this._skills.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly skillsCount = computed(() => this._skills().length);

  getSkillById(id: string): SkillModel | undefined {
    return this._skills().find(s => s.id === id);
  }

  async loadSkills(): Promise<SkillModel[]> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.get<SkillModel[]>(this.apiUrl));
      this._skills.set(data);
      return data;
    } catch {
      this._error.set('Failed to load skills.');
      return [];
    } finally {
      this._isLoading.set(false);
    }
  }

  async addSkill(skillData: SkillPayload): Promise<SkillModel | null> {
    this._error.set(null);

    try {
      const created = await firstValueFrom(
        this.http.post<SkillModel>(this.apiUrl, skillData)
      );
      this._skills.update(current => [...current, created]);
      return created;
    } catch {
      this._error.set('Failed to create skill. Are you logged in?');
      return null;
    }
  }

  async updateSkill(id: string, skillData: SkillPayload): Promise<SkillModel | null> {
    this._error.set(null);

    try {
      const updated = await firstValueFrom(
        this.http.put<SkillModel>(`${this.apiUrl}/${id}`, skillData)
      );
      this._skills.update(current =>
        current.map(skill => (skill.id === id ? updated : skill))
      );
      return updated;
    } catch {
      this._error.set('Failed to update skill.');
      return null;
    }
  }

  async deleteSkill(id: string): Promise<boolean> {
    this._error.set(null);

    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
      this._skills.update(current => current.filter(s => s.id !== id));
      return true;
    } catch {
      this._error.set('Failed to delete skill.');
      return false;
    }
  }
}
