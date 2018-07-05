- Add descriptions for novices (e.g., chart title)
- Add abstract value selection on Encoding
- SVG save
- Improve View panel for novices
- handle undo-redo actions (remove theme change action)
- Focus plot by click

- Things to read
  - redux: https://deminoth.github.io/redux/basics/Reducers.html
- Debug
  - https://blogs.msdn.microsoft.com/jtarquino/2016/01/24/debugging-typescript-in-visual-studio-code-and-chrome/

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
