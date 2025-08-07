import Slider from './modules/slider.js';

const banner = new Slider('#slider-wrapper', '#slider-track', {
  prevControl: "[data-control='prev']",
  nextControl: "[data-control='next']",
});
banner.init();
