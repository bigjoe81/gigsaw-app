import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular';
import { HomePage } from './home.page';

describe('HomePage', () => {
  it('renders the Live welcome page', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideIonicAngular()],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Gigsaw Live');
  });
});
