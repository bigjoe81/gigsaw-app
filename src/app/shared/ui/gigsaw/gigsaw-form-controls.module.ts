import { NgModule } from '@angular/core';
import { GigsawCheckboxComponent } from './gigsaw-checkbox.component';
import { GigsawDatepickerComponent } from './gigsaw-datepicker.component';
import { GigsawFileInputComponent } from './gigsaw-file-input.component';
import { GigsawInputComponent } from './gigsaw-input.component';
import { GigsawTextareaComponent } from './gigsaw-textarea.component';
import { GigsawTimeInputComponent } from './gigsaw-time-input.component';

@NgModule({
  imports: [
    GigsawCheckboxComponent,
    GigsawDatepickerComponent,
    GigsawFileInputComponent,
    GigsawInputComponent,
    GigsawTextareaComponent,
    GigsawTimeInputComponent,
  ],
  exports: [
    GigsawCheckboxComponent,
    GigsawDatepickerComponent,
    GigsawFileInputComponent,
    GigsawInputComponent,
    GigsawTextareaComponent,
    GigsawTimeInputComponent,
  ],
})
export class GigsawFormControlsModule {}
