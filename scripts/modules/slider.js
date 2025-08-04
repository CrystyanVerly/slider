export default class Slider {
  constructor(wrapper, rail) {
    this.wrapper = document.querySelector(wrapper);
    this.rail = document.querySelector(rail);
    this.distances = {
      initial: 0,
      moving: 0,
      final: 0,
      lastPosition: 0,
    };
  }

  addRailEvents() {
    this.rail.addEventListener('mousedown', this.onInitial);
  }

  onInitial(e) {
    e.preventDefault();
    this.distances.initial = e.clientX;
    this.rail.addEventListener('mousemove', this.onMoving);
    this.rail.addEventListener('mouseup', this.onFinal);
  }

  onMoving(e) {
    const distanceTraveled = this.distanceTracker(e.clientX);
    this.moveItems(distanceTraveled);
  }

  onFinal(e) {
    this.distances.final = this.distances.lastPosition;
    this.rail.removeEventListener('mousemove', this.onMoving);
    this.rail.removeEventListener('mouseup', this.onFinal);
  }

  distanceTracker(currentX) {
    const calculedDistance = -(
      (this.distances.initial - currentX) *
      1.6
    ).toFixed();
    this.distances.moving = calculedDistance;
    console.log(this.distances);

    return this.distances.final + calculedDistance;
  }

  moveItems(distanceTraveled) {
    this.distances.lastPosition = distanceTraveled;
    this.rail.style.transform = `translate3d(${distanceTraveled}px, 0px, 0px)`;
  }

  bindingMethods() {
    ['onInitial', 'onMoving', 'onFinal'].forEach(
      (method) => (this[method] = this[method].bind(this)),
    );
  }

  init() {
    this.bindingMethods();
    if (this.rail) {
      this.addRailEvents();
    }
    return this;
  }
}
