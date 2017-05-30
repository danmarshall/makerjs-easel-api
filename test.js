var makerjs = require('makerjs');
var meapi = require('./index');

var rrect = {
  "paths": {
    "ShapeLine1": {
      "type": "line",
      "origin": [
        0.07874015748031496,
        0
      ],
      "end": [
        3.381073033170492,
        0
      ]
    },
    "ShapeLine2": {
      "type": "line",
      "origin": [
        3.4598131906508067,
        0.07874015748031495
      ],
      "end": [
        3.4598131906508067,
        1.2500479768569455
      ]
    },
    "ShapeLine3": {
      "type": "line",
      "origin": [
        3.381073033170492,
        1.3287881343372605
      ],
      "end": [
        0.07874015748031496,
        1.3287881343372605
      ]
    },
    "ShapeLine4": {
      "type": "line",
      "origin": [
        0,
        1.2500479768569455
      ],
      "end": [
        0,
        0.07874015748031497
      ]
    }
  },
  "models": {
    "fillets": {
      "paths": {
        "fillet0": {
          "origin": [
            3.381073033170492,
            0.07874015748031496
          ],
          "radius": 0.07874015748031496,
          "startAngle": 270,
          "endAngle": 360,
          "type": "arc"
        },
        "fillet1": {
          "origin": [
            3.381073033170492,
            1.2500479768569455
          ],
          "radius": 0.07874015748031496,
          "startAngle": 0,
          "endAngle": 90,
          "type": "arc"
        },
        "fillet2": {
          "origin": [
            0.07874015748031496,
            1.2500479768569455
          ],
          "radius": 0.07874015748031496,
          "startAngle": 90,
          "endAngle": 180,
          "type": "arc"
        },
        "fillet3": {
          "origin": [
            0.07874015748031496,
            0.07874015748031496
          ],
          "radius": 0.07874015748031496,
          "startAngle": 180,
          "endAngle": 270,
          "type": "arc"
        }
      }
    }
  }
};

var chain = makerjs.model.findSingleChain(rrect);
var points = meapi.exportChainToEaselPoints(chain);
var rrect2 = new meapi.EaselPathModel(points);

console.log(JSON.stringify(rrect2));

