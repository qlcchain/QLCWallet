import { TestBed, inject } from '@angular/core/testing';

import { QLCBlockService } from './nano-block.service';

describe('NanoBlockService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QLCBlockService]
    });
  });

  it('should be created', inject([QLCBlockService], (service: QLCBlockService) => {
    expect(service).toBeTruthy();
  }));
});
