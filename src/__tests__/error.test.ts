import * as z from '../index.ts';
import { ZodError, ZodErrorCode } from '../ZodError.ts';
import { ZodParsedType } from '../parser.ts';

test('error creation', () => {
  const err1 = ZodError.create([]);
  err1.addError({
    code: ZodErrorCode.invalid_type,
    expected: ZodParsedType.object,
    received: ZodParsedType.string,
    path: [],
    message: '',
  });
  err1.isEmpty;

  const err2 = ZodError.create(err1.errors);
  const err3 = new ZodError([]);
  err3.addErrors(err1.errors);
  err3.addError(err1.errors[0]);
  err1.message;
  err2.message;
  err3.message;
});

const errorMap: z.ZodErrorMap = (error, ctx) => {
  if (error.code === ZodErrorCode.invalid_type) {
    if (error.expected === 'string') {
      return { message: 'bad type!' };
    }
  }
  if (error.code === ZodErrorCode.custom_error) {
    return { message: `less-than-${(error.params || {}).minimum}` };
  }
  return { message: ctx.defaultError };
};

test('type error with custom error map', () => {
  try {
    z.string().parse('asdf', { errorMap });
  } catch (err) {
    const zerr: z.ZodError = err;
    expect(zerr.errors[0].code).toEqual(z.ZodErrorCode.invalid_type);
    expect(zerr.errors[0].message).toEqual(`bad type!`);
  }
});

test('refinement fail with params', () => {
  try {
    z.number()
      .refinement({
        check: val => val >= 3,
        params: { minimum: 3 },
      })
      .parse(2, { errorMap });
  } catch (err) {
    const zerr: z.ZodError = err;
    expect(zerr.errors[0].code).toEqual(z.ZodErrorCode.custom_error);
    expect(zerr.errors[0].message).toEqual(`less-than-3`);
  }
});

test('custom error with custom errormap', () => {
  try {
    z.string()
      .refinement({
        check: val => val.length > 12,
        params: { minimum: 13 },
        message: 'override',
      })
      .parse('asdf', { errorMap });
  } catch (err) {
    const zerr: z.ZodError = err;
    expect(zerr.errors[0].message).toEqual('override');
  }
});

test('default error message', () => {
  try {
    z.number()
      .refine(x => x > 3)
      .parse(2);
  } catch (err) {
    const zerr: z.ZodError = err;
    expect(zerr.errors.length).toEqual(1);
    expect(zerr.errors[0].message).toEqual('Invalid value.');
  }
});

test('override error in refine', () => {
  try {
    z.number()
      .refine(x => x > 3, 'override')
      .parse(2);
  } catch (err) {
    const zerr: z.ZodError = err;
    expect(zerr.errors.length).toEqual(1);
    expect(zerr.errors[0].message).toEqual('override');
  }
});

test('override error in refinement', () => {
  try {
    z.number()
      .refinement({
        check: x => x > 3,
        message: 'override',
      })
      .parse(2);
  } catch (err) {
    const zerr: z.ZodError = err;
    expect(zerr.errors.length).toEqual(1);
    expect(zerr.errors[0].message).toEqual('override');
  }
});

test('array minimum', () => {
  try {
    z.array(z.string())
      .min(3, 'tooshort')
      .parse(['asdf', 'qwer']);
  } catch (err) {
    const zerr: ZodError = err;
    expect(zerr.errors[0].code).toEqual(ZodErrorCode.too_small);
    expect(zerr.errors[0].message).toEqual('tooshort');
  }
  try {
    z.array(z.string())
      .min(3)
      .parse(['asdf', 'qwer']);
  } catch (err) {
    const zerr: ZodError = err;
    expect(zerr.errors[0].code).toEqual(ZodErrorCode.too_small);
    expect(zerr.errors[0].message).toEqual(`Should have at least 3 items`);
  }
});

// implement test for semi-smart union logic that checks for type error on either left or right
test('union smart errors', () => {
  expect.assertions(2);
  z.union([z.string(), z.number().int()])
    .parseAsync(3.2)
    .catch(err => expect(err.errors[0].code).toEqual(ZodErrorCode.invalid_type));
  z.union([z.string(), z.number()])
    .parseAsync(false)
    .catch(err => expect(err.errors[0].code).toEqual(ZodErrorCode.invalid_union));
});
