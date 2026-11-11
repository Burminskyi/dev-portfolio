import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkillFormComponent } from './skill-form';

describe('SkillForm', () => {
  let component: SkillFormComponent;
  let fixture: ComponentFixture<SkillFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
