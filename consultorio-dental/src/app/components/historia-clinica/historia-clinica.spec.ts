import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriaClinica } from './historia-clinica';

describe('HistoriaClinica', () => {
  let component: HistoriaClinica;
  let fixture: ComponentFixture<HistoriaClinica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriaClinica],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoriaClinica);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
