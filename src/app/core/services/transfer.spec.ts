import { TestBed } from '@angular/core/testing';

import { Transfer } from './transfer';

describe('Transfer', () => {
  let service: Transfer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Transfer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
