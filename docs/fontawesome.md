# Font Awesome Pro Solid

The application uses Font Awesome Pro Solid icons. Shared UI symbols should use
`app-symbol`; its legacy names map to Solid icon definitions in
`src/app/shared/ui/fontawesome-solid-icon-registry.ts`.

For component-specific icons, import only the definitions you need:

```ts
import { faMusic } from '@fortawesome/pro-solid-svg-icons';
import { GigsawIconComponent } from '../../../shared/ui/gigsaw';

// Add GigsawIconComponent to the component's imports.
readonly musicIcon = faMusic;
```

```html
<app-gigsaw-icon [icon]="musicIcon" aria-hidden="true" />
```

For a meaningful standalone icon, supply `label="Music"`. Icons next to a text
label should stay decorative. Direct icon imports keep unused icons out of the
bundle; avoid registering the entire Solid collection.

Install dependencies with `pnpm install --frozen-lockfile`. An authorized
Font Awesome Pro package token must be configured for the npm registry.
