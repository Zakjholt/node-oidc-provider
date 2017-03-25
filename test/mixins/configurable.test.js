const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const Configurable = require.requireActual(file);

const inst = new (class extends Configurable() {})();

describe('Configurable mixin', () => {
  it('sets up settings Map instance', () => {
    expect(inst).toHaveProperty('settings');
    expect(inst.settings).toBeInstanceOf(Map);
  });

  it('mixes in #get, #set', () => {
    expect(inst.get('foo')).toBeUndefined();
    inst.set('foo', 'bar');
    expect(inst.get('foo')).toBe('bar');

    expect(inst.set('one', 'one')).toBe(inst); // set is chainable
    expect(inst.get('one')).toBe('one');
  });

  it('mixes in #enable, #enabled, #disable, #disabled, ', () => {
    expect(inst.enabled('feature')).toBe(false);
    expect(inst.disabled('feature')).toBe(true);

    expect(inst.enable('feature')).toBe(inst); // enable is chainable
    expect(inst.enabled('feature')).toBe(true);
    expect(inst.disabled('feature')).toBe(false);

    expect(inst.disable('feature')).toBe(inst); // disable is chainable
    expect(inst.disabled('feature')).toBe(true);
    expect(inst.enabled('feature')).toBe(false);
  });
});
