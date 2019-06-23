import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MapComponent, NgbdModalContent } from './modal-component';

@NgModule({
  imports: [BrowserModule, NgbModule],
  declarations: [MapComponent, NgbdModalContent],
  exports: [MapComponent],
  bootstrap: [MapComponent],
  entryComponents: [NgbdModalContent]
})
export class NgbdModalComponentModule {

  
}
