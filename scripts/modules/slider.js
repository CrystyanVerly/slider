import throttle from './throttle.js';

export default class Slider {
  constructor(wrapper, rail, config = {}) {
    this.wrapper = document.querySelector(wrapper);
    this.rail = document.querySelector(rail);
    this.distances = { initial: 0, moving: 0, final: 0 };
    this.index = { active: 0 };

    this.config = {
      initialItem: 0,
      looping: false,
      prevControl: null,
      nextControl: null,
      activeClass: 'active',
      ...config,
    };

    if (typeof this.config.prevControl === 'string') {
      this.config.prevControl = document.querySelector(this.config.prevControl);
    }
    if (typeof this.config.nextControl === 'string') {
      this.config.nextControl = document.querySelector(this.config.nextControl);
    }

    this.bindingMethods();
  }

  // ==== PUBLIC ====
  init() {
    if (this.wrapper && this.rail) {
      this.cloneIfLooping();
      this.itemsOnRail();
      this.addStartEvent();
      this.addGoToIfLooping();
      this.updateOnResize();
      this.goTo(this.config.initialItem + (this.config.looping ? 1 : 0));
    } else console.warn(`No wrapper or rail found.`);
  }

  // ==== SETUP ====
  bindingMethods() {
    const methodsToBind = [
      'onStart',
      'onFinal',
      'prevItem',
      'nextItem',
      'goToIfLooping',
    ];
    methodsToBind.forEach((method) => {
      this[method] = this[method].bind(this);
    });

    this.onMoving = throttle(this.onMoving.bind(this), 16);
    this.onResizing = throttle(this.onResizing.bind(this), 200);
  }

  addStartEvent() {
    this.wrapper.addEventListener('pointerdown', this.onStart, {
      passive: false,
    });

    const controlEvent = ['click', 'touchstart'];
    if (this.config.prevControl && this.config.nextControl) {
      controlEvent.forEach((event) => {
        this.config.prevControl.addEventListener(event, this.prevItem);
        this.config.nextControl.addEventListener(event, this.nextItem);
      });
    }
  }

  addGoToIfLooping() {
    this.rail.addEventListener('transitionend', this.goToIfLooping);
  }

  updateOnResize() {
    window.addEventListener('resize', this.onResizing);
  }

  itemsOnRail() {
    this.arrItems = [...this.rail.children].map((item) => {
      const onLeft = -item.offsetLeft;
      return { item, onLeft };
    });
    return this.arrItems;
  }

  cloneIfLooping() {
    if (!this.config.looping) return;

    const elements = [...this.rail.children];
    const firstEl = elements[0];
    const lastEl = elements[elements.length - 1];

    const firstElClone = firstEl.cloneNode(true);
    const lastElClone = lastEl.cloneNode(true);
    const classClone = 'clonedItem';

    firstElClone.classList.add(classClone);
    lastElClone.classList.add(classClone);

    this.rail.insertBefore(lastElClone, firstEl);
    this.rail.appendChild(firstElClone);
  }

  // ==== ITEM CHANGE ====
  goTo(index, transition = true) {
    const arrSize = this.arrItems.length;
    const lastIndex = arrSize - 1;

    if (index < 0 || index > arrSize - 1) console.warn(`Invalid index chosen`);

    if (!this.config.looping) {
      if (index < 0) index = 0;
      if (index > lastIndex) index = lastIndex;
    }

    const { onLeft } = this.arrItems[index];
    this.moveSlide(onLeft, transition);
    this.distances.final = onLeft;
    this.index.active = index;
  }

  prevItem(e) {
    e?.preventDefault();
    this.goTo(this.index.active - 1);
  }

  nextItem(e) {
    e?.preventDefault();
    this.goTo(this.index.active + 1);
  }

  toggleActive() {
    const elementList = this.arrItems;
    const activeClass = this.config.activeClass;
    elementList.forEach((el) => el.item.classList.remove(activeClass));

    const realIndex = this.getRealIndex(this.index.active);
    const realItem = this.arrItems[realIndex];
    console.log(realItem);

    if (realItem) realItem.item.classList.add(activeClass);
  }

  goToIfLooping() {
    const lastIndex = this.arrItems.length - 1;
    const activeIndex = this.index.active;
    if (!this.config.looping) {
      this.toggleActive();
      return;
    }

    if (activeIndex === lastIndex) this.goTo(1, false);
    if (activeIndex === 0) this.goTo(lastIndex - 1, false);

    this.toggleActive();
  }

  // ==== MOVEMENT ====
  updatePosition(currentX) {
    const calcDist = Math.round((currentX - this.distances.initial) * 1.5);
    this.distances.moving = calcDist;
    return this.distances.final + calcDist;
  }

  moveSlide(distX, transition = true) {
    this.rail.style.transform = `translate3d(${distX}px, 0px, 0px)`;
    this.rail.style.transition = transition
      ? 'transform .3s ease-in-out'
      : 'none';
  }

  changeOnMoving() {
    const minMove = this.wrapper.offsetWidth * 0.06;
    if (this.distances.moving < -minMove) this.nextItem();
    else if (this.distances.moving > minMove) this.prevItem();
    else this.goTo(this.index.active);
  }

  // ==== EVENTS (DRAG) ====
  onStart(e) {
    e.preventDefault();
    this.distances.initial = Math.round(e.clientX);
    this.wrapper.addEventListener('pointermove', this.onMoving);
    this.wrapper.addEventListener('pointerup', this.onFinal);
  }

  onMoving(e) {
    this.moveSlide(this.updatePosition(e.clientX), false);
  }

  onFinal(e) {
    this.wrapper.removeEventListener('pointermove', this.onMoving);
    this.wrapper.removeEventListener('pointerup', this.onFinal);
    this.changeOnMoving(e);
    this.distances.moving = 0;
  }

  // ==== RESIZE ====
  onResizing() {
    setTimeout(() => {
      this.itemsOnRail();
      this.goTo(this.index.active);
    }, 500);
  }

  // ==== UTILS ====
  getRealIndex(index) {
    if (!this.config.looping) return index;
    if (index === 0) return this.arrItems.length - 3;
    if (index === this.arrItems.length - 1) return 0;
    return index;
  }
}
