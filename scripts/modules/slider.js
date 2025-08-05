import throttle from './throttle.js';
export default class Slider {
  constructor(wrapper, rail) {
    this.wrapper = document.querySelector(wrapper);
    this.rail = document.querySelector(rail);
    this.distances = { initial: 0, moving: 0, final: 0 };
    this.bindingMethods();
  }
  moveSlide(distX) {
    this.distances.moving = distX;
    this.rail.style.transform = `translate3d(${distX}px, 0px, 0px)`;
  }
  updatePosition(currentX) {
    const calcDist = -Math.round((this.distances.initial - currentX) * 1.6);
    this.distances.moving = calcDist;
    return this.distances.final + calcDist;
  }
  onFinal() {
    this.distances.final = this.distances.moving;
    this.wrapper.removeEventListener('mousemove', this.onMoving);
    this.wrapper.removeEventListener('mouseup', this.onFinal);
  }
  onMoving(e) {
    this.moveSlide(this.updatePosition(e.clientX));
  }
  onStart(e) {
    e.preventDefault();
    this.distances.initial = e.clientX;
    this.wrapper.addEventListener('mousemove', this.onMoving);
    this.wrapper.addEventListener('mouseup', this.onFinal);
  }
  addStartEvent() {
    this.wrapper.addEventListener('mousedown', this.onStart);
  }
  bindingMethods() {
    const methodsToBind = ['onStart', 'onFinal'];
    methodsToBind.forEach((method) => (this[method] = this[method].bind(this)));

    this.onMoving = throttle(this.onMoving.bind(this), 16);
  }
  init() {
    if (this.wrapper && this.rail) {
      this.addStartEvent();
    } else {
      console.warn(`No wrapper or rail found.`);
    }
  }
}
