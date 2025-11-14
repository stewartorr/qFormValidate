# qFormValidate

## Intro

qFormValidate is a simple javascript form validation script that can be dropped into your form pages which adds simple validation and input checks straight out of the box. It can also be configured to do custom validation on more complicated fields.

## Documentation

[More documentation coming soon]

You can integrate this into your own project using export or a simple include on the page.

```
  <script type="module">
    import { qFormValidate } from './dist/index.js';

    const form = document.getElementById('myForm');
    qFormValidate(form, {
      onBeforeValidate: () => console.log('Validating...'),
      onAfterValidate: () => console.log('Done validating!'),
      onFieldSuccess: (field) => console.log(field, 'VALID')
    });
  </script>
```

## Try it

[Demo](https://<username>.github.io/qFormValidate/)
