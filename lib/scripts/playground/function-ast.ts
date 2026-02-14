import { parse } from "@hashnotes/core/parser";
import { renderWithFuel } from "../../../core/src/codegen.ts";

const printFunctionAst = (fn: (...args: unknown[]) => unknown) => {
  const source = fn.toString();
  const ast = parse(source);
  const regeneratedCode = renderWithFuel(ast, 10000);
  console.log("Function source:");
  console.log(source);
  console.log("\nAST:");
  console.log(JSON.stringify(ast, null, 2));
  console.log("\nRegenerated code:");
  console.log(regeneratedCode);

};

const sampleFn = (arg: { x: number; y: number }) => {
  const sum = arg.x + arg.y;
  return { sum, ok: sum > 0 };
};

printFunctionAst(sampleFn);
