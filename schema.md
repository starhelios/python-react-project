# JSON schema definition

We need to have a fully configurable UI for image annotation that is defined by three JSON objects: schema, options, and data.  This UI will allow any number of checkbox options, bounding box options, text input fields.  The code from the annotorious library will probably need to re-used and refactored.

The Latex type elements should include both the editing area as well as the rendered Latex.

I want to allow multiple bounding box types, some of which will allow text entry and some of which will not.  The user needs to be able to select the type of bouding box he / she wants by clicking on a selector button.  On the top of the page.  See Slack for more info.

I need to be able to create a rendered UI by just specifying the three JSON objects.

### Schema
```json
{
  "fields": [
    {"type": "text", "label": "Image name: ", "id": "image_name"},
    {"type": "checkbox", "label": "Is done", "id": "is_done"},
    {"type": "dropdown", "label": "Image type", "id": "image_type"},
    {"type": "latex", "label": "Latex", "id": "latex"},
    {"type": "latex", "label": "Pre-latex", "id": "pre_latex"},
    {
      "type": "image",
      "id": "image",
      "label": "Image",
      "fields": [
        {
          "type": "bbox",
          "label": "Dog bounding boxes.",
          "id": "dogs",
          "has_text": false,
          "marker_width": 0.1,
          "color": "#000000"
        },
        {
          "type": "bbox",
          "label": "Cat bounding boxes.",
          "id": "cats",
          "has_text": false,
          "marker_width": 0.1,
          "color": "#FF0000"
        },
        {
          "type": "bbox",
          "label": "Other",
          "id": "other",
          "has_text": true,
          "marker_width": 0.1,
          "color": "#FF00FF"
        }
      ]
    }
  ]
}
```

### Options
```json
{
  "image_type": {"options": ["Daytime picture", "Nightime picture"], "default_idx": 0}
}
```

### Data
```json
{
  "image": {"url": "http://static4.businessinsider.com/image/587fbec3ee14b6c7148b892e-1495/undefined"},
  "is_done": true,
  "latex": "x^{2} + x",
  "image_type": {"value": "Daytime picture", "idx": 0},
  "cats": [{"cx": 0.1, "cy": 0.2, "w": 0.1, "h": 0.2}],
  "other": [{"cx": 0.1, "cy": 0.2, "w": 0.8, "h": 0.3, "text": "Strange animal"}],
}
```
