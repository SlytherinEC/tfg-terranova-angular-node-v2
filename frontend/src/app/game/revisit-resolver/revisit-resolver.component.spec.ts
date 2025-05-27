import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisitResolverComponent } from './revisit-resolver.component';

describe('RevisitResolverComponent', () => {
  let component: RevisitResolverComponent;
  let fixture: ComponentFixture<RevisitResolverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevisitResolverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevisitResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 