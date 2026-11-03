import { Type } from '@angular/core';
import { BandResource, ResourceKey } from '../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../core/services/band-scoped-crud.service';

export type FieldType = 'text' | 'number' | 'date' | 'time' | 'textarea' | 'url' | 'select';

export interface ResourceField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface ResourceConfig<T extends BandResource = BandResource> {
  key: ResourceKey;
  singular: string;
  plural: string;
  /** Entity label field; defaults to `title`. */
  titleKey?: string;
  fields: ResourceField[];
  service: Type<BandScopedCrudService<T>>;
}
