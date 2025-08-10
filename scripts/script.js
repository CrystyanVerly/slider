import { SliderCTRL } from '../scripts/modules/slider.js';

const slider = new SliderCTRL({
  wrapper: '[data-slider="wrapper"]',
  rail: '[data-slider="rail"]',
  config: {
    prevControl: '[data-control="prev"]',
    nextControl: '[data-control="next"]',
  },
});

slider.init();
console.log(slider);
