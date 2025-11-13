import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidacaoFacialModal } from './validacao-facial-modal';

describe('ValidacaoFacialModal', () => {
  let component: ValidacaoFacialModal;
  let fixture: ComponentFixture<ValidacaoFacialModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidacaoFacialModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidacaoFacialModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
