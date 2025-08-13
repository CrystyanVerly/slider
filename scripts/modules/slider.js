import throttle from './throttle.js';

export default class Slider {
  constructor({ wrapper, rail, config = {} }) {
    this.wrapper = document.querySelector(wrapper);
    this.rail = document.querySelector(rail);
    if (!this.wrapper || !this.rail)
      throw new Error(`Invalid querySelector at ${wrapper} or ${rail}`);

    this.config = {
      firstItem: 0,
      looping: true,
      autoPlay: { play: true, interval: 4000, pause: false },
      activeClass: 'active',
      ...config,
    };

    this.distances = { initial: 0, moving: 0, final: 0 };
    this.index = { active: 0 };
    this.changeEvent = new Event('changeEvent');
    this.bindingMethods();
  }

  // ==== PUBLIC ====
  init() {
    this.cloneIfLooping();
    this.itemsOnRail();
    this.addStartEvent();
    this.addGoToIfLooping();
    this.updateOnResize();
    this.goTo(this.config.firstItem + (this.config.looping ? 1 : 0));
  }

  // ==== SETUP ====
  bindingMethods() {
    const toBind = [
      'onStart',
      'onFinal',
      'goToIfLooping',
      'prevItem',
      'nextItem',
      'linkingControls',
      'toggleActiveControls',
    ];
    toBind.forEach((m) => (this[m] = this[m].bind(this)));
    this.onMoving = throttle(this.onMoving.bind(this), 16);
    this.onResizing = throttle(this.onResizing.bind(this), 200);
  }

  addStartEvent() {
    this.wrapper.addEventListener('pointerdown', this.onStart, {
      passive: false,
    });
  }

  addGoToIfLooping() {
    this.rail.addEventListener('transitionend', this.goToIfLooping);
  }

  updateOnResize() {
    window.addEventListener('resize', this.onResizing);
  }

  itemsOnRail() {
    this.itemsWithClones = [...this.rail.children];

    this.items = this.itemsWithClones.filter(
      (el) => !el.classList.contains(this.classClone),
    );

    this.itemsPosition = this.itemsWithClones.map((item) => {
      const onLeft = -item.offsetLeft;
      return { item, onLeft };
    });

    return {
      items: this.items,
      itemsWithClones: this.itemsWithClones,
      itemsPosition: this.itemsPosition,
    };
  }

  cloneIfLooping() {
    if (!this.config.looping) return;
    const elements = [...this.rail.children];

    if (elements.length < 2) return;

    const firstEl = elements[0];
    const lastEl = elements[elements.length - 1];

    const firstElClone = firstEl.cloneNode(true);
    const lastElClone = lastEl.cloneNode(true);
    this.classClone = 'clonedItem';

    firstElClone.classList.add(this.classClone);
    lastElClone.classList.add(this.classClone);

    this.rail.insertBefore(lastElClone, firstEl);
    this.rail.appendChild(firstElClone);
  }

  // ==== ITEM CHANGE ====
  goTo(index, transition = true) {
    const arrSize = this.itemsWithClones.length;
    const lastIndex = arrSize - 1;

    if (this.config.looping) {
      if (index < 0) index = 1;
      if (index > lastIndex) index = lastIndex - 1;
    } else {
      if (index < 0) index = 0;
      if (index > lastIndex) index = lastIndex;
    }

    const { onLeft } = this.itemsPosition[index];
    this.moveSlide(onLeft, transition);
    this.distances.final = onLeft;
    this.index.active = index;
    this.wrapper.dispatchEvent(this.changeEvent);
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
    const activeClass = this.config.activeClass;

    this.items.forEach((el) => el.classList.remove(activeClass));

    const realIndex = this.getRealIndex(this.index.active);
    const realItem = this.items[realIndex];
    if (realItem) realItem.classList.add(activeClass);

    this.accessibility();
  }

  goToIfLooping() {
    if (!this.config.looping) {
      this.toggleActive();
      return;
    }

    const lastIndex = this.itemsWithClones.length - 1;
    const activeIndex = this.index.active;

    if (activeIndex === lastIndex) this.goTo(1, false);
    else if (activeIndex === 0) this.goTo(lastIndex - 1, false);

    this.toggleActive();
  }

  // ==== MOVEMENT ====
  updatePosition(currentX) {
    const calcDist = Math.round((currentX - this.distances.initial) * 1.5);
    this.distances.moving = calcDist;
    return this.distances.final + calcDist;
  }

  moveSlide(distX, transition = true, transTime = 300) {
    this.rail.style.transform = `translate3d(${distX}px, 0, 0)`;
    this.rail.style.transition = transition
      ? `transform .${transTime}s ease`
      : 'none';
  }

  changeOnMoving() {
    const minMove = this.wrapper.offsetWidth * 0.06;
    if (this.distances.moving < -minMove) this.nextItem();
    else if (this.distances.moving > minMove) this.prevItem();
    else this.goTo(this.index.active);
  }

  autoPLay() {
    if (!this.config.autoPlay.play) return;
    const interval = this.config.autoPlay.interval;
    this.intervalID = null;
    if (this.intervalID) clearInterval(this.intervalID);
    this.intervalID = setInterval(() => {
      this.nextItem();
    }, interval);
  }

  pauseAutoPlay() {
    const pauseAutoPlay = this.config.autoPlay.pause;
    const interval = this.config.autoPlay.interval;

    this.resumeTimeout = null;
    if (this.intervalID) {
      clearInterval(this.intervalID);
      this.intervalID = null;
    }
    if (this.resumeTimeout) clearInterval(this.resumeTimeout);

    this.resumeTimeout = setTimeout(() => this.autoPLay(), interval);
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
    }, 200);
  }

  // ==== UTILS ====
  getRealIndex(index) {
    if (!this.config.looping) return index;

    const totalOriginals = this.items.length;
    const totalWithClones = this.itemsWithClones.length;

    if (index === 0) return totalOriginals - 1;
    if (index === totalWithClones - 1) return 0;
    return index - 1;
  }

  // ==== ACCESSIBILITY ====
  accessibility() {
    const activeClass = this.config.activeClass;

    this.itemsWithClones.forEach((child) => {
      const isActive = child.classList.contains(activeClass);
      if (
        !isActive &&
        document.activeElement &&
        child.contains(document.activeElement)
      )
        document.activeElement.blur();

      child.toggleAttribute('inert', !isActive);
      child.setAttribute('aria-hidden', String(!isActive));
      child.setAttribute('tabindex', isActive ? '0' : '-1');

      if (isActive) child.setAttribute('aria-current', 'true');
      else child.removeAttribute('aria-current');
    });
  }
}

export class SliderCTRL extends Slider {
  constructor(defaultParams) {
    super(defaultParams);

    const userCfg =
      defaultParams && defaultParams.config ? defaultParams.config : {};

    const cfg = (this.config = {
      ...this.config,
      enableControls: true,
      activeControlClass: 'active-dot',
      ...userCfg,
    });

    this.prevControl = cfg.prevControl
      ? document.querySelector(cfg.prevControl)
      : null;
    this.nextControl = cfg.nextControl
      ? document.querySelector(cfg.nextControl)
      : null;
    this.customControl = cfg.customControl
      ? document.querySelector(cfg.customControl)
      : null;

    this.classActiveDot = cfg.activeControlClass;
    this.userEvents = ['click', 'touchstart'];
  }

  // ==== PUBLIC ====
  init() {
    super.init();
    this.addControls();
    this.toggleActiveControls(this.controls);
  }

  addEventsArrow() {
    if (!this.prevControl && !this.nextControl) return;
    this.userEvents.forEach((evt) => {
      this.prevControl.addEventListener(evt, this.prevItem);
      this.nextControl.addEventListener(evt, this.nextItem);
    });
  }

  addEventsControls(arrControls) {
    if (!this.wrapper && !this.enableControls) return;

    arrControls.forEach((c) =>
      this.userEvents.forEach((evt) =>
        c.addEventListener(evt, this.linkingControls),
      ),
    );

    this.wrapper.addEventListener('changeEvent', () =>
      this.toggleActiveControls(arrControls),
    );
  }

  createCustomControl() {
    if (!this.customControl) return;

    const userControl = [...this.customControl.children];

    if (userControl.length) {
      userControl.forEach((ctrl, i) => {
        ctrl.dataset.index = i;
        ctrl.setAttribute('aria-label', `item ${i + 1}`);
        const img = ctrl.querySelector('img');
        if (img) img.setAttribute('alt', img.alt || `Item ${i + 1}`);
      });
    }

    return userControl;
  }

  createDotControl() {
    const items = this.items;
    const railDot = document.createElement('ul');
    railDot.dataset.control = 'default';

    const fragment = document.createDocumentFragment();
    items.forEach((_, i) => {
      const dotLi = document.createElement('li');
      dotLi.dataset.index = i;

      const dotLink = document.createElement('a');
      dotLink.href = `#slide${i}`;
      dotLink.setAttribute('aria-label', `go to item ${i + 1}`);

      dotLi.appendChild(dotLink);
      fragment.appendChild(dotLi);
    });
    railDot.appendChild(fragment);
    this.wrapper.appendChild(railDot);

    return [...railDot.children];
  }

  addControls() {
    this.addEventsArrow();

    if (!this.config.enableControls) return;
    this.controls = this.createCustomControl() || this.createDotControl();
    this.addEventsControls(this.controls);
  }

  toggleActiveControls(arrControls) {
    if (!arrControls?.length) return;
    arrControls.forEach((dot) => dot.classList.remove(this.classActiveDot));
    const realIndex = this.getRealIndex(this.index.active);
    const dot = arrControls[realIndex];
    if (dot) dot.classList.add(this.classActiveDot);
  }

  linkingControls(e) {
    e.preventDefault();
    const dotIndex = +e.currentTarget.dataset.index;
    const linkedItem = dotIndex + (this.config.looping ? 1 : 0);
    this.goTo(linkedItem);
  }
}
