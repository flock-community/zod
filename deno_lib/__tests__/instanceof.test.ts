const test = Deno.test;
import { expect } from "https://deno.land/x/expect/mod.ts";import * as z from '../index.ts';
import { util } from '../helpers/util.ts';

test('instanceof', async () => {
  class Test {}
  class Subtest extends Test {}

  const TestSchema = z.instanceof(Test);
  const SubtestSchema = z.instanceof(Subtest);

  TestSchema.parse(new Test());
  TestSchema.parse(new Subtest());
  SubtestSchema.parse(new Subtest());

  await expect(() => SubtestSchema.parse(new Test())).toThrow(
    /Input not instance of Subtest/,
  );
  await expect(() => TestSchema.parse(12)).toThrow(
    /Input not instance of Test/,
  );

  const f1: util.AssertEqual<Test, z.infer<typeof TestSchema>> = true;
  expect(f1).toBeTruthy();
});
