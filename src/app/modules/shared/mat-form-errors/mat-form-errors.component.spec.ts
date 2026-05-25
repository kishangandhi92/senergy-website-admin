import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatFormErrorsComponent } from './mat-form-errors.component';

describe('MatFormErrorsComponent', () => {
  let component: MatFormErrorsComponent;
  let fixture: ComponentFixture<MatFormErrorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatFormErrorsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MatFormErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
