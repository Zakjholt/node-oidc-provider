module.exports = (Sup = class {}) => class extends Sup {
  constructor() {
    super();
    this.settings = new Map();
  }

  get(setting) {
    return this.settings.get(setting);
  }

  // set value
  set(setting, val) {
    this.settings.set(setting, val);

    return this;
  }

  /**
   * Check if `setting` is enabled (truthy).
   *
   *    provider.enabled('foo')
   *    // => false
   *
   *    provider.enable('foo')
   *    provider.enabled('foo')
   *    // => true
   *
   * @param {String} setting
   * @return {Boolean}
   * @public
   */

  enabled(setting) {
    return Boolean(this.get(setting));
  }

  /**
   * Check if `setting` is disabled.
   *
   *    provider.disabled('foo')
   *    // => true
   *
   *    provider.enable('foo')
   *    provider.disabled('foo')
   *    // => false
   *
   * @param {String} setting
   * @return {Boolean}
   * @public
   */

  disabled(setting) {
    return !this.get(setting);
  }

  /**
   * Enable `setting`.
   *
   * @param {String} setting
   * @return {provider}
   * @public
   */

  enable(setting, value = true) {
    return this.set(setting, value);
  }

  /**
   * Disable `setting`.
   *
   * @param {String} setting
   * @return {provider}
   * @public
   */

  disable(setting) {
    return this.set(setting, false);
  }
};
