import { TestBed } from '@angular/core/testing';

import { Reportes } from './reportes';

describe('Reportes', () => {
  let service: Reportes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Reportes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
