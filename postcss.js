/*!
 * PostCSS RFS plugin
 *
 * Automated font-resizing
 *
 * Licensed under MIT (https://github.com/twbs/rfs/blob/master/LICENSE)
 */

'use strict';

const postcss = require('postcss');

module.exports = postcss.plugin('postcss-rfs', opts => {
  const defaultOptions = {
    baseFontSize: 20,
    fontSizeUnit: 'rem',
    breakpoint: 1200,
    breakpointUnit: 'px',
    factor: 10,
    twoDimensional: false,
    unitPrecision: 5,
    remValue: 16,
    functionName: 'rfs',
    enableResponsiveFontSizes: true
  };

  opts = Object.assign(defaultOptions, opts);

  const regexp = new RegExp('(?!\\W+)' + opts.functionName + '\\(([^()]+)\\)', 'g');

  const convert = values => values.replace(/(\d*\.?\d+)(.*)?/g, (match, value, unit) => {
    value = parseFloat(value);

    // return value if it's not a number or px/rem value
    if (isNaN(value) || !['px', 'rem', undefined].includes(unit)) {
      return match;
    }

    // Multiply by remValue if value is in rem
    if (unit === 'rem') {
      value *= opts.remValue;
    }

    // Only add responsive function if needed
    if (opts.baseFontSize >= value || opts.factor <= 1 || !opts.enableResponsiveFontSizes) {
      return renderValue(value);
    }

    // Calculate font-size and font-size difference
    let baseFontSize = opts.baseFontSize + ((value - opts.baseFontSize) / opts.factor);
    const fontSizeDiff = value - baseFontSize;

    // Divide by remValue if needed
    if (opts.fontSizeUnit === 'rem') {
      baseFontSize /= opts.remValue;
    }

    const viewportUnit = opts.twoDimensional ? 'vmin' : 'vw';
    const fluidvalue = `calc(${toFixed(baseFontSize, opts.unitPrecision)}${opts.fontSizeUnit} + ${toFixed(fontSizeDiff * 100 / opts.breakpoint, opts.unitPrecision)}${viewportUnit})`;

    return `min(${renderValue(value)}, ${fluidvalue})`;
  });

  return css => {
    css.replaceValues(regexp, {fast: opts.functionName + '('}, (_, values) => convert(values));
  };

  function toFixed(number, precision) {
    const multiplier = Math.pow(10, precision + 1);
    const wholeNumber = Math.floor(number * multiplier);

    return Math.round(wholeNumber / 10) * 10 / multiplier;
  }

  function renderValue(value) {
    // Render value in desired unit
    if (opts.fontSizeUnit === 'rem') {
      return `${toFixed(value / opts.remValue, opts.unitPrecision)}rem`;
    }

    return `${toFixed(value, opts.unitPrecision)}px`;
  }
});
