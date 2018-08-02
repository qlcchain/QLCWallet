import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QlcAccountIdComponent } from './qlc-account-id.component';

describe('QlcAccountIdComponent', () => {
  let component: QlcAccountIdComponent;
  let fixture: ComponentFixture<QlcAccountIdComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [QlcAccountIdComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QlcAccountIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
