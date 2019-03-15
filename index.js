#!/usr/bin/env node

const shapefile = require('shapefile');

let next = false;

const maxLen = process.argv[4] || 1000;

function split(coords, properties) {
  if (coords.length > maxLen) {
    split(coords.slice(0, coords.length / 2 + 1), properties);
    split(coords.slice(coords.length / 2, coords.length), properties);
  } else {
    console.log((next ? ',' : '') + JSON.stringify({
      type: 'Feature',
      properties,
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
    }));

    if (!next) {
      next = true;
    }
  }
}

async function run() {
  // /media/martin/data/martin/mapping/dmr20/new/contours.shp
  const source = await shapefile.open(process.argv[2]);

  console.log('{"type": "FeatureCollection", "features": [');

  for (;;) {
    const result = await source.read();
    if (result.done) {
      break;
    }

    const { properties } = result.value;
    let props;
    if (process.argv[4]) {
      props = {};
      for (const key of process.argv[3].split(',')) {
        if (key in properties) {
          props[key] = properties[key];
        }
      }
    } else {
      props = properties;
    }

    split(result.value.geometry.coordinates, props);
  }

  console.log(']}');
}

if (process.argv.length < 3) {
  console.log(`Usage: shp-polyline-splitter shapefile [comma_separated_properties [maxLength=1000]]`);
} else {
  run();
}
