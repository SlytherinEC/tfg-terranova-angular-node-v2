import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventResolverComponent } from './event-resolver.component';

describe('EventResolverComponent', () => {
  let component: EventResolverComponent;
  let fixture: ComponentFixture<EventResolverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventResolverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
