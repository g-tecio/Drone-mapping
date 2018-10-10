import { TestBed, inject } from '@angular/core/testing';

import { MapsLibService } from './maps-lib.service';

describe('MapsLibService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MapsLibService]
    });
  });

  it('should be created', inject([MapsLibService], (service: MapsLibService) => {
    expect(service).toBeTruthy();
  }));
});
