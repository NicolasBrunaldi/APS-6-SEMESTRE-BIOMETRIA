import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityCodeModal } from './security-code-modal';

describe('SecurityCodeModal', () => {
  let component: SecurityCodeModal;
  let fixture: ComponentFixture<SecurityCodeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityCodeModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityCodeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
