import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroUserModal } from './cadastro-user-modal';

describe('CadastroUserModal', () => {
  let component: CadastroUserModal;
  let fixture: ComponentFixture<CadastroUserModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroUserModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroUserModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
