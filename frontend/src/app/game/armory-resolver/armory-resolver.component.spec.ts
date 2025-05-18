import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArmoryResolverComponent } from './armory-resolver.component';

describe('ArmoryResolverComponent', () => {
  let component: ArmoryResolverComponent;
  let fixture: ComponentFixture<ArmoryResolverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArmoryResolverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArmoryResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
