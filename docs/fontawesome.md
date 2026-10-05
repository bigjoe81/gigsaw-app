# Font Awesome Pro Light

The Angular integration and `@fortawesome/pro-light-svg-icons` are installed.
The repertoire page uses Classic Light icons. `FaConfig.defaultPrefix` is set to `fal`
(Classic Light). Existing Ionic icons continue to work.

## Enable Pro access

Get your Package Token from https://fontawesome.com/account/tokens.
Copy `.npmrc.fontawesome.example` to `.npmrc` and set
`FONTAWESOME_PACKAGE_TOKEN` in your terminal or CI secrets. The example uses an
environment variable; never replace it with a literal token in tracked files.

Install project dependencies:

```sh
npm ci
```

The environment variable must also be available for subsequent npm installs.

## Use an icon

Import only the icons a component needs:

```ts
import { faMusic } from '@fortawesome/pro-light-svg-icons';
import { GigsawIconComponent } from '../../../shared/ui/gigsaw';

// Add GigsawIconComponent to the component's imports.
// Expose the definition on the component:
readonly musicIcon = faMusic;
```

```html
<app-gigsaw-icon [icon]="musicIcon" aria-hidden="true" />
```

For a meaningful standalone icon, supply `label="Music"`. Icons next to a text
label should stay decorative. Direct `IconDefinition` imports keep unused icons
out of the bundle; avoid registering the entire Light collection.
