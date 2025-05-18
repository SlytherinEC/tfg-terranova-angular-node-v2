import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StressManagerComponent } from './stress-manager.component';

describe('StressManagerComponent', () => {
  let component: StressManagerComponent;
  let fixture: ComponentFixture<StressManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StressManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StressManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
