import { expect } from 'chai';

import {
  defineBool,
  defineInt,
  defineFloat,
  defineJSON,
  defineString,
  defineTime,
  isParsed,
  parse,
} from '../dist/flags.js';

const boolFlag = defineBool('bool', false, 'lorem');

const intFlag = defineInt('int', 42, 'ipsum');

const floatFlag = defineFloat('float', 3.14, 'dolor');

const jsonFlag = defineJSON(
  'json',
  {
    foo: 'bar',
    baz: 123,
  },
  'amet'
);

const stringFlag = defineString('string', 'foo bar baz', 'consectetur');

const timeFlag = defineTime('time', new Date('December 17, 1995 03:24:00'), 'adipisci');

function setQuery(overrides, callback) {
  const flags = [];
  for (const name in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, name)) {
      flags.push(encodeURIComponent(name) + '=' + encodeURIComponent('' + overrides[name]));
    }
  }
  const global = new Function('return this')();
  global.location = { search: '?' + flags.join('&') };
  try {
    callback();
  } finally {
    delete global.location;
  }
}

describe('Flags', function () {
  it('parse', function () {
    const overrides = {
      bool: true,
      int: 123,
      float: 2.71,
      json: JSON.stringify({ foo: 'baz', bar: 42 }),
      string: 'baz bar foo',
      time: 'July 11, 2004 07:11:04',
    };
    setQuery(overrides, () => {
      expect(isParsed()).to.equal(false);
      expect(boolFlag.getValue()).to.equal(false);
      expect(intFlag.getValue()).to.equal(42);
      expect(floatFlag.getValue()).to.be.closeTo(3.14, 0.001);
      expect(jsonFlag.getValue()).to.eql({ foo: 'bar', baz: 123 });
      expect(stringFlag.getValue()).to.equal('foo bar baz');
      expect(timeFlag.getValue().valueOf()).to.equal(
        new Date('December 17, 1995 03:24:00').valueOf()
      );
      parse();
      expect(isParsed()).to.equal(true);
      expect(boolFlag.getValue()).to.equal(true);
      expect(intFlag.getValue()).to.equal(123);
      expect(floatFlag.getValue()).to.be.closeTo(2.71, 0.001);
      expect(jsonFlag.getValue()).to.eql({ foo: 'baz', bar: 42 });
      expect(stringFlag.getValue()).to.equal('baz bar foo');
      expect(timeFlag.getValue().valueOf()).to.equal(new Date('July 11, 2004 07:11:04').valueOf());
    });
  });

  it('boolean', function () {
    expect(boolFlag.name).to.equal('bool');
    expect(boolFlag.description).to.equal('lorem');
    expect(boolFlag.traits.parse('true')).to.equal(true);
    expect(boolFlag.traits.parse('false')).to.equal(false);
    expect(boolFlag.traits.parse('1')).to.equal(true);
    expect(boolFlag.traits.parse('0')).to.equal(false);
    expect(boolFlag.traits.parse('')).to.equal(true);
    expect(boolFlag.traits.unparse(true)).to.equal('true');
    expect(boolFlag.traits.unparse(false)).to.equal('false');
  });

  it('int', function () {
    expect(intFlag.name).to.equal('int');
    expect(intFlag.description).to.equal('ipsum');
    expect(intFlag.traits.parse('123')).to.equal(123);
    expect(intFlag.traits.parse('456')).to.equal(456);
    expect(intFlag.traits.unparse(123)).to.equal('123');
    expect(intFlag.traits.unparse(456)).to.equal('456');
  });

  it('float', function () {
    expect(floatFlag.name).to.equal('float');
    expect(floatFlag.description).to.equal('dolor');
    expect(floatFlag.traits.parse('12.34')).to.be.closeTo(12.34, 0.001);
    expect(floatFlag.traits.parse('56.78')).to.be.closeTo(56.78, 0.001);
    expect(floatFlag.traits.unparse(12.34)).to.equal('12.34');
    expect(floatFlag.traits.unparse(56.78)).to.equal('56.78');
  });

  it('json', function () {
    expect(jsonFlag.name).to.equal('json');
    expect(jsonFlag.description).to.equal('amet');
    expect(jsonFlag.traits.parse(JSON.stringify({ foo: 'bar' }))).to.eql({ foo: 'bar' });
    expect(jsonFlag.traits.unparse({ bar: 'baz' })).to.equal(JSON.stringify({ bar: 'baz' }));
  });

  it('string', function () {
    expect(stringFlag.name).to.equal('string');
    expect(stringFlag.description).to.equal('consectetur');
    expect(stringFlag.traits.parse('foo')).to.equal('foo');
    expect(stringFlag.traits.unparse('bar')).to.equal('bar');
  });

  it('time', function () {
    const text = 'July 11, 2004 07:11:04';
    const date = new Date(text);
    expect(timeFlag.name).to.equal('time');
    expect(timeFlag.description).to.equal('adipisci');
    expect(timeFlag.traits.parse(text).valueOf()).to.equal(date.valueOf());
    expect(timeFlag.traits.unparse(date)).to.equal(date.toISOString());
  });

  it('force', function () {
    intFlag.setValue(12);
    const result = intFlag.force(34, () => {
      expect(intFlag.getValue()).to.equal(34);
      return 56;
    });
    expect(result).to.equal(56);
    expect(intFlag.getValue()).to.equal(12);
  });
});
