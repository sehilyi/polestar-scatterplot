# Guidelines
- NEW_CHART_BINNED_SCATTERPLOT
- GROUP_VISUAL_ELEMENTS_COLOR
- CLUTTER_REDUCTION

# Main Features
- Add descriptions for novices (e.g., chart title)
- SVG save
- Add explanations in guideline
  - Technical reasons
  - Academic reasons
- Issue on reset and undo
- Show results of user actions (e.g., “5 categories filtered and 12 selected”)

# Bugs
- Ignore => unIgnore, always state == WARN
- When removing filter, category related guideline should inserted
- When two fields swaped, "
- sometimes, legends are not indicated well (e.g., shape and color in a same legend)
- RESULT_RECEIVE repeatedly occur

## One way to color etc categories.
{
  "$schema": "https://vega.github.io/schema/vega-lite/v2.json",
  "data": {"url": "data/barley.json"},
  "description": "Slope graph showing the change in yield for different barley sites. It shows the error in the year labels for the Morris site.",
  "mark": "circle",
   "transform": [
    {
      "lookup": "site",
      "from": {
        "data": {"values": [
      {"a": "Duluth","b": "Duluth"}, {"a": "Crookston","b": "Crookston"},
      {"a": "Grand Rapids","b": "Others"}, {"a": "Morris","b": "Others"},
      {"a": "University Farm","b": "Others"}, {"a": "Waseca","b": "Others"}
    ]},
        "key": "a",
        "fields": ["b"]
      }
    }
  ],
  "encoding": {
    "x": {
      "field": "year",
      "type": "ordinal",
      "scale": {"rangeStep": 50, "padding": 0.5}
    },
    "y": {
      "field": "yield",
      "type": "quantitative"
    },
    "color": {"field": "b", "type": "nominal","scale":{"range": ["red", "blue", "gray"]}}
  }
}
