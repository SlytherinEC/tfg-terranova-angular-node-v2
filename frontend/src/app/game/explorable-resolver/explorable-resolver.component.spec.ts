import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplorableResolverComponent } from './explorable-resolver.component';

describe('ExplorableResolverComponent', () => {
  let component: ExplorableResolverComponent;
  let fixture: ComponentFixture<ExplorableResolverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorableResolverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExplorableResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
