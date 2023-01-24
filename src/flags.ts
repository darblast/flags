/**
 * Defines how to parse and unparse a given flag type.
 *
 * "Unparsing" means serializing back to a string.
 *
 * The module provides canned traits for common flag types, along with corresponding convenience
 * `define` methods such as {@link defineString}, {@link defineInt}, etc.
 */
export interface FlagTraitsInterface<Type> {
  /**
   * Parses a flag of the given type.
   *
   * @param text The text to parse.
   */
  parse(text: string): Type;

  /**
   * Serializes a flag value to a string.
   *
   * @param value The value to serialize.
   */
  unparse(value: Type): string;
}

/**
 * Manages a flag of the given type.
 *
 * Flags are typed parameters provided by the user in the URL. They are provided as named settings
 * in the query part.
 */
export interface FlagInterface<Type> {
  /**
   * Defines how to parse and unparse the flag.
   */
  readonly traits: FlagTraitsInterface<Type>;

  /**
   * The name of the flag.
   *
   * The name is used to identify the value in the URL query part.
   */
  readonly name: string;

  /**
   * A text description documenting what the flag does.
   */
  readonly description: string;

  /**
   * Returns the current value of the flag.
   *
   * Note that the value is uninitialized before flags are parsed, which happens in response to the
   * `DOMContentLoaded` event by default.
   */
  getValue(): Type;

  /**
   * Forces the flag to a specific value.
   *
   * @param value The new value.
   */
  setValue(value: Type): void;

  /**
   * Returns a string representation of the current value of the flag.
   */
  toString(): string;

  /**
   * Overrides the flag with the provided value throughout the execution of a callback.
   *
   * The original value is automatically restored after the execution of the callback.
   *
   * Example:
   *
   * ```js
   * import { defineInt } from '@darblast/flags';
   *
   * const param = defineInt('param', 42);
   *
   * function foobar() {
   *   param.force(123, () => {
   *     console.log(param.getValue());  // logs 123
   *   });
   *   console.log(param.getValue());  // logs 42 or the value provided in the URL.
   * }
   * ```
   *
   * This is mainly useful in testing.
   *
   * @param value The new value.
   * @param callback A user-defined function.
   * @param scope An optional scope object for the callback invocation.
   */
  force<Result>(value: Type, callback: () => Result, scope: object | null): Result;
}

class Flag<Type> implements FlagInterface<Type> {
  public constructor(
    public readonly traits: FlagTraitsInterface<Type>,
    public readonly name: string,
    public readonly description: string,
    private _value: Type
  ) {}

  public getValue(): Type {
    return this._value;
  }

  public setValue(value: Type): void {
    this._value = value;
  }

  public toString(): string {
    return this.traits.unparse(this._value);
  }

  public force<Result>(value: Type, callback: () => Result, scope: object | null = null): Result {
    const oldValue = this._value;
    this._value = value;
    try {
      return callback.call(scope);
    } finally {
      this._value = oldValue;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flags: { [name: string]: Flag<any> } = Object.create(null);

let parsed = false;

/**
 * Defines a flag of the given type.
 *
 * This method is not typically used directly for common flag types; rather, one of the convenience
 * wrappers such as {@link defineString}, {@link defineInt}, etc. is used.
 *
 * @param traits The traits for the flag type, defining how the flag is parsed and unparsed.
 * @param name Name of the flag.
 * @param defaultValue Default value used when the flag is not specified in the URL.
 * @param description Description documenting the flag.
 * @returns A {@link FlagInterface} object of the given type.
 */
export function define<Type>(
  traits: FlagTraitsInterface<Type>,
  name: string,
  defaultValue: Type,
  description = ''
): FlagInterface<Type> {
  if (name in flags) {
    throw new Error(`flag ${JSON.stringify(name)} is defined twice`);
  } else {
    return (flags[name] = new Flag(traits, name, description, defaultValue));
  }
}

class BooleanFlagTraits {
  static parse(text: string): boolean {
    text = text.trim();
    if (!text.length) {
      return true;
    }
    if ('true' === text.toLowerCase()) {
      return true;
    }
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed) {
      return true;
    }
    return false;
  }

  static unparse(value: boolean): string {
    return '' + !!value;
  }
}

/**
 * Defines a boolean flag.
 *
 * Boolean flags may not have any value and are rendered as a boolean that is `true` if the name was
 * present in the URL query and `false` otherwise. They can optionally have a value which can be
 * `true`, `false`, `1`, or `0`.
 *
 * See {@link define} for more information.
 */
export function defineBool(
  name: string,
  defaultValue: boolean,
  description = ''
): FlagInterface<boolean> {
  return define(BooleanFlagTraits, name, defaultValue, description);
}

class StringFlagTraits {
  static parse(text: string): string {
    return text;
  }

  static unparse(value: string): string {
    return value;
  }
}

/**
 * Defines a string flag.
 *
 * See {@link define} for more information.
 */
export function defineString(
  name: string,
  defaultValue: string,
  description = ''
): FlagInterface<string> {
  return define(StringFlagTraits, name, defaultValue, description);
}

class IntFlagTraits {
  static parse(text: string): number {
    return parseInt(text, 10);
  }

  static unparse(value: number): string {
    return '' + ~~value;
  }
}

/**
 * Defines an integer flag.
 *
 * Parsed with `parseInt(..., 10)`.
 *
 * See {@link define} for more information.
 */
export function defineInt(
  name: string,
  defaultValue: number,
  description = ''
): FlagInterface<number> {
  return define(IntFlagTraits, name, defaultValue, description);
}

class FloatFlagTraits {
  static parse(text: string): number {
    return parseFloat(text);
  }

  static unparse(value: number): string {
    return '' + +value;
  }
}

/**
 * Defines a floating point flag.
 *
 * Parsed with `parseFloat`.
 *
 * See {@link define} for more information.
 */
export function defineFloat(
  name: string,
  defaultValue: number,
  description = ''
): FlagInterface<number> {
  return define(FloatFlagTraits, name, defaultValue, description);
}

class TimeFlagTraits {
  static parse(text: string): Date {
    return new Date(text);
  }

  static unparse(value: Date): string {
    return value.toISOString();
  }
}

/**
 * Defines a flag representing a date / a point in time.
 *
 * This is parsed using the `Date` constructor, so please refer to the documentation of that to
 * determine what the valid inputs are.
 *
 * See {@link define} for more information.
 */
export function defineTime(
  name: string,
  defaultValue: Date,
  description = ''
): FlagInterface<Date> {
  return define(TimeFlagTraits, name, defaultValue, description);
}

class JSONFlagTraits {
  static parse(text: string): object {
    return JSON.parse(text);
  }

  static unparse(value: object): string {
    return JSON.stringify(value);
  }
}

/**
 * Defines a flag containing a JSON object.
 *
 * Parsed with `JSON.parse`.
 *
 * See {@link define} for more information.
 */
export function defineJSON(
  name: string,
  defaultValue: object,
  description = ''
): FlagInterface<object> {
  return define(JSONFlagTraits, name, defaultValue, description);
}

/**
 * Provides global access to a flag object.
 *
 * Useful if the flag needs to be accessed in a context where its definition is not visible, e.g. in
 * another module.
 *
 * WARNING: the caller is responsible for ensuring that the `Type` is correct.
 *
 * @param name Name of the flag.
 * @returns A {@link FlagInterface} object to access the flag.
 */
export function getFlagObject<Type>(name: string): FlagInterface<Type> {
  if (name in flags) {
    return flags[name];
  } else {
    throw new Error(`flag ${JSON.stringify(name)} is undefined`);
  }
}

/**
 * Convenience wrapper for {@link getFlagObject} to access the value of a flag directly.
 *
 * WARNING: the caller is responsible for ensuring that the `Type` is correct.
 *
 * @param name The name of the flag.
 * @returns The value of the flag.
 */
export function getFlag<Type>(name: string): Type {
  return getFlagObject<Type>(name).getValue();
}

/**
 * Overrides the value of a flag throughout the execution of a user-provided callback.
 *
 * This is merely a short-hand for `flag.force(...)`, and can be used in contexts where a reference
 * to the flag object is not available.
 *
 * @param name Name of the flag.
 * @param value New value of the flag.
 * @param callback A user-defined callback function.
 * @param scope An optional scope object for the callback invocation.
 * @returns
 */
export function forceFlag<Type, Result>(
  name: string,
  value: Type,
  callback: () => Result,
  scope: object | null = null
): Result {
  return getFlagObject<Type>(name).force(value, callback, scope);
}

function getGlobal(): Window | null {
  return new Function('return this')();
}

/**
 * Triggers parsing of all the defined flags.
 *
 * By default all flags are parsed automatically in response to `DOMContentLoaded`, but you can use
 * this function to trigger parsing manually e.g. if you're running in an environment that is not a
 * browser.
 */
export function parse(): void {
  if (parsed) {
    console.log('flags have already been parsed, will not parse again');
    return;
  }
  parsed = true;
  const hash: { [key: string]: string } = Object.create(null);
  getGlobal()
    ?.location?.search.replace(/^\?/, '')
    .split('&')
    .filter(parameter => parameter.length > 0)
    .forEach(parameter => {
      const index = parameter.indexOf('=');
      if (index < 0) {
        hash[decodeURIComponent(parameter)] = '';
      } else {
        const key = decodeURIComponent(parameter.slice(0, index));
        const value = decodeURIComponent(parameter.slice(index + 1));
        hash[key] = value;
      }
    });
  for (const name in hash) {
    if (name in flags) {
      const parsed = flags[name].traits.parse(hash[name]);
      flags[name].setValue(parsed);
    } else {
      console.warn(`URL has undefined flag ${JSON.stringify(name)}`);
    }
  }
}

/**
 * @returns `true` if the flags have been parsed, `false` otherwise.
 */
export function isParsed(): boolean {
  return parsed;
}

(window => {
  window?.addEventListener?.('DOMContentLoaded', parse, false);
})(getGlobal());
