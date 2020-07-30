import * as z from '../index.ts';
import { crazySchema } from './complex.test.ts';

test('ZodCodeGenerator', () => {
  const gen = new z.ZodCodeGenerator();
  gen.generate(crazySchema);
  console.log(gen.dump());
});
