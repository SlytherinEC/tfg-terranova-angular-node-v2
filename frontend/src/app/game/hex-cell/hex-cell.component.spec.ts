import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HexCellComponent } from './hex-cell.component';

describe('HexCellComponent', () => {
  let component: HexCellComponent;
  let fixture: ComponentFixture<HexCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HexCellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HexCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
