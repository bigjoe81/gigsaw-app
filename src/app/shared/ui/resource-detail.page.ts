import { Component, Injector, OnInit } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertController, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonSkeletonText, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { ResourceConfig } from '../models/resource-form.models';
import { BandResource } from '../../core/models/band-resources.models';

@Component({
  standalone: true,
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonSkeletonText, IonTitle, IonToolbar],
  templateUrl: './resource-detail.page.html',
})
export class ResourceDetailPage implements OnInit {
  config!: ResourceConfig; item?: BandResource; loading = true; private id!: number; private service: any;
  constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly injector: Injector, private readonly alert: AlertController, private readonly toast: ToastController) {}
  ngOnInit(): void { this.config = this.route.snapshot.data['resource']; this.service = this.injector.get(this.config.service); this.id = Number(this.route.snapshot.paramMap.get('id')); this.service.get(this.id).subscribe({ next: (item: BandResource) => {this.item=item;this.loading=false;}, error:()=>this.loading=false }); }
  display(key: string): string { const value = (this.item as any)?.[key]; return value === null || value === undefined || value === '' ? '' : String(value); }
  async confirmDelete(): Promise<void> { const dialog = await this.alert.create({ header: `Eliminare ${this.config.singular}?`, message: 'L’operazione non può essere annullata.', buttons: [{ text: 'Annulla', role: 'cancel' }, { text: 'Elimina', role: 'destructive', handler: () => this.delete() }] }); await dialog.present(); }
  private delete(): void { this.service.delete(this.id).subscribe({ next: async () => { (await this.toast.create({message:`${this.config.singular} eliminato.`,duration:1800,color:'success'})).present(); void this.router.navigate(['.'], { relativeTo: this.route.parent }); }, error: async () => (await this.toast.create({message:'Eliminazione non riuscita.',duration:2200,color:'danger'})).present() }); }
}
