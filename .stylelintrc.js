module.exports = {
  "extends": "stylelint-config-standard",
  "plugins": ["stylelint-scss"],
  "rules": {
    "at-rule-no-unknown": null,
    "scss/at-rule-no-unknown": true,
    "no-descending-specificity": null,
    "property-no-unknown": [true, { "ignoreProperties": ["aspect-ratio", "animation-timeline", "animation-range"] }]
  },
}
