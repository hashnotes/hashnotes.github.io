import { parse as acornParse } from "acorn";

export type Program = { type: "Program"; body: Stmt[] };
export type BlockStatement = { type: "BlockStatement"; body: Stmt[] };
export type Stmt =
  | BlockStatement
  | { type: "ExpressionStatement"; expression: Expr }
  | { type: "IfStatement"; test: Expr; consequent: Stmt; alternate: Stmt | null }
  | { type: "ReturnStatement"; argument: Expr | null }
  | { type: "VariableDeclaration"; kind: "let" | "const"; declarations: VarDecl[] }
  | { type: "BreakStatement" }
  | { type: "ContinueStatement" }
  | { type: "WhileStatement"; test: Expr; body: Stmt }
  | {
      type: "ForStatement";
      init: VarDecl[] | Expr | null;
      initKind: "let" | "const" | null;
      test: Expr | null;
      update: Expr | null;
      body: Stmt;
    }
  | { type: "ForInStatement"; left: VarDecl[] | Expr; leftKind: "let" | "const" | null; right: Expr; body: Stmt }
  | { type: "ForOfStatement"; left: VarDecl[] | Expr; leftKind: "let" | "const" | null; right: Expr; body: Stmt };

export type Pattern =
  | Identifier
  | RestElement
  | { type: "ArrayPattern"; elements: Pattern[] }
  | { type: "ObjectPattern"; properties: (PatternProperty | RestElement)[] };

export type RestElement = { type: "RestElement"; argument: Pattern };

export type PatternProperty = {
  type: "Property";
  key: Identifier | Literal;
  value: Pattern;
  shorthand: boolean;
};

export type VarDecl = { type: "VariableDeclarator"; id: Pattern; init: Expr | null };

export type Expr =
  | Identifier
  | SpreadElement
  | Literal
  | { type: "ArrayExpression"; elements: (Expr | SpreadElement)[] }
  | { type: "ObjectExpression"; properties: (Property | SpreadElement)[] }
  | { type: "AwaitExpression"; argument: Expr }
  | { type: "CallExpression"; callee: Expr; arguments: (Expr | SpreadElement)[] }
  | { type: "MemberExpression"; object: Expr; property: Expr; computed: boolean }
  | { type: "AssignmentExpression"; operator: string; left: Expr; right: Expr }
  | { type: "UpdateExpression"; operator: "++" | "--"; argument: Expr; prefix: boolean }
  | { type: "BinaryExpression"; operator: string; left: Expr; right: Expr }
  | { type: "LogicalExpression"; operator: string; left: Expr; right: Expr }
  | { type: "UnaryExpression"; operator: string; argument: Expr }
  | { type: "ConditionalExpression"; test: Expr; consequent: Expr; alternate: Expr }
  | { type: "ArrowFunctionExpression"; params: Pattern[]; body: Expr | BlockStatement; async: boolean };

export type Identifier = { type: "Identifier"; name: string };
export type SpreadElement = { type: "SpreadElement"; argument: Expr };
export type Literal = { type: "Literal"; value: string | number | boolean | null };
export type Property = { type: "Property"; key: Identifier | Literal; value: Expr; shorthand: boolean };

export const validateScopes = (program: Program, allowedGlobals: string[] = []) => {
  const errors: string[] = [];
  const globals = new Set(allowedGlobals);
  const scopes: Array<Set<string>> = [new Set()];

  const declare = (name: string) => scopes[scopes.length - 1].add(name);
  const isDeclared = (name: string) => scopes.some((s) => s.has(name)) || globals.has(name);
  const enter = () => scopes.push(new Set());
  const exit = () => { scopes.pop(); };
  const checkIdent = (name: string) => {
    if (!isDeclared(name)) errors.push(`undeclared: ${name}`);
  };

  const declarePattern = (p: Pattern) => {
    if (p.type === "Identifier") declare(p.name);
    else if (p.type === "RestElement") declarePattern(p.argument);
    else if (p.type === "ArrayPattern") p.elements.forEach(declarePattern);
    else p.properties.forEach((prop) => {
      if (prop.type === "RestElement") declarePattern(prop.argument);
      else declarePattern(prop.value);
    });
  };

  const visitExpr = (e: Expr): void => {
    switch (e.type) {
      case "Identifier":
        checkIdent(e.name);
        return;
      case "Literal":
        return;
      case "SpreadElement":
        visitExpr(e.argument);
        return;
      case "ArrayExpression":
        e.elements.forEach((el) => visitExpr(el));
        return;
      case "ObjectExpression":
        e.properties.forEach((p) => {
          if (p.type === "SpreadElement") visitExpr(p.argument);
          else visitExpr(p.value);
        });
        return;
      case "AwaitExpression":
        visitExpr(e.argument);
        return;
      case "CallExpression":
        visitExpr(e.callee);
        e.arguments.forEach((a) => visitExpr(a));
        return;
      case "MemberExpression":
        visitExpr(e.object);
        if (e.computed) visitExpr(e.property);
        return;
      case "AssignmentExpression":
        visitExpr(e.left);
        visitExpr(e.right);
        return;
      case "UpdateExpression":
        visitExpr(e.argument);
        return;
      case "BinaryExpression":
      case "LogicalExpression":
        visitExpr(e.left);
        visitExpr(e.right);
        return;
      case "UnaryExpression":
        visitExpr(e.argument);
        return;
      case "ConditionalExpression":
        visitExpr(e.test);
        visitExpr(e.consequent);
        visitExpr(e.alternate);
        return;
      case "ArrowFunctionExpression":
        enter();
        e.params.forEach(declarePattern);
        if (e.body.type === "BlockStatement") visitStmt(e.body);
        else visitExpr(e.body);
        exit();
        return;
    }
  };

  const visitVarDecl = (d: VarDecl) => {
    declarePattern(d.id);
    if (d.init) visitExpr(d.init);
  };

  const visitStmt = (s: Stmt): void => {
    switch (s.type) {
      case "BlockStatement":
        enter();
        s.body.forEach(visitStmt);
        exit();
        return;
      case "ExpressionStatement":
        visitExpr(s.expression);
        return;
      case "IfStatement":
        visitExpr(s.test);
        visitStmt(s.consequent);
        if (s.alternate) visitStmt(s.alternate);
        return;
      case "ReturnStatement":
        if (s.argument) visitExpr(s.argument);
        return;
      case "VariableDeclaration":
        s.declarations.forEach(visitVarDecl);
        return;
      case "WhileStatement":
        visitExpr(s.test);
        visitStmt(s.body);
        return;
      case "ForStatement": {
        enter();
        if (Array.isArray(s.init)) s.init.forEach(visitVarDecl);
        else if (s.init) visitExpr(s.init);
        if (s.test) visitExpr(s.test);
        if (s.update) visitExpr(s.update);
        visitStmt(s.body);
        exit();
        return;
      }
      case "ForInStatement":
      case "ForOfStatement": {
        enter();
        if (Array.isArray(s.left)) s.left.forEach(visitVarDecl);
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        exit();
        return;
      }
      case "BreakStatement":
      case "ContinueStatement":
        return;
    }
  };

  program.body.forEach(visitStmt);
  return errors;
};

export const validateNoPrototype = (program: Program) => {
  const errors: string[] = [];
  const forbiddenMembers = new Set(["prototype", "constructor", "__proto__"]);
  const visitExpr = (e: Expr): void => {
    switch (e.type) {
      case "MemberExpression":
        if (!e.computed && e.property.type === "Identifier" && forbiddenMembers.has(e.property.name)) {
          errors.push("prototype access");
        }
        if (e.computed && !(e.property.type === "Literal" && typeof e.property.value === "number")) {
          errors.push("only numeric literal indexing allowed");
        }
        visitExpr(e.object);
        if (e.computed) visitExpr(e.property);
        return;
      case "SpreadElement":
        visitExpr(e.argument);
        return;
      case "CallExpression":
        visitExpr(e.callee);
        e.arguments.forEach((a) => visitExpr(a));
        return;
      case "AwaitExpression":
        visitExpr(e.argument);
        return;
      case "ArrayExpression":
        e.elements.forEach((el) => visitExpr(el));
        return;
      case "ObjectExpression":
        e.properties.forEach((p) => {
          if (p.type === "SpreadElement") visitExpr(p.argument);
          else visitExpr(p.value);
        });
        return;
      case "AssignmentExpression":
        visitExpr(e.left);
        visitExpr(e.right);
        return;
      case "UpdateExpression":
        visitExpr(e.argument);
        return;
      case "BinaryExpression":
      case "LogicalExpression":
        visitExpr(e.left);
        visitExpr(e.right);
        return;
      case "UnaryExpression":
        visitExpr(e.argument);
        return;
      case "ConditionalExpression":
        visitExpr(e.test);
        visitExpr(e.consequent);
        visitExpr(e.alternate);
        return;
      case "ArrowFunctionExpression":
        if (e.body.type === "BlockStatement") visitStmt(e.body);
        else visitExpr(e.body);
        return;
      case "Identifier":
      case "Literal":
        return;
    }
  };
  const visitStmt = (s: Stmt): void => {
    switch (s.type) {
      case "BlockStatement":
        s.body.forEach(visitStmt);
        return;
      case "ExpressionStatement":
        visitExpr(s.expression);
        return;
      case "IfStatement":
        visitExpr(s.test);
        visitStmt(s.consequent);
        if (s.alternate) visitStmt(s.alternate);
        return;
      case "ReturnStatement":
        if (s.argument) visitExpr(s.argument);
        return;
      case "VariableDeclaration":
        s.declarations.forEach((d) => d.init && visitExpr(d.init));
        return;
      case "WhileStatement":
        visitExpr(s.test);
        visitStmt(s.body);
        return;
      case "ForStatement":
        if (Array.isArray(s.init)) s.init.forEach((d) => d.init && visitExpr(d.init));
        else if (s.init) visitExpr(s.init);
        if (s.test) visitExpr(s.test);
        if (s.update) visitExpr(s.update);
        visitStmt(s.body);
        return;
      case "ForInStatement":
      case "ForOfStatement":
        if (Array.isArray(s.left)) s.left.forEach((d) => d.init && visitExpr(d.init));
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        return;
      case "BreakStatement":
      case "ContinueStatement":
        return;
    }
  };
  program.body.forEach(visitStmt);
  return errors;
};

type Node = {
  type: string;
  start?: number;
  [key: string]: unknown;
};

const nodePos = (n: Node): number => (typeof n.start === "number" ? n.start : -1);

const unsupported = (n: Node, msg: string): never => {
  throw new Error(`${msg} at ${nodePos(n)}`);
};

const expectStringEnum = <T extends string>(
  node: Node,
  value: unknown,
  allowed: readonly T[],
  label: string,
): T => {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    unsupported(node, `${label}: ${String(value)}`);
  }
  return value as T;
};

const asNode = (value: unknown, where: string): Node => {
  if (!value || typeof value !== "object" || typeof (value as Node).type !== "string") {
    throw new Error(`Invalid AST node for ${where}`);
  }
  return value as Node;
};

const asNodeList = (value: unknown, where: string): Node[] => {
  if (!Array.isArray(value)) throw new Error(`Expected array for ${where}`);
  return value.map((v, i) => asNode(v, `${where}[${i}]`));
};

const toIdentifier = (node: Node): Identifier => {
  if (node.type !== "Identifier") unsupported(node, `Unsupported identifier node: ${node.type}`);
  const name = node.name;
  if (typeof name !== "string") throw new Error(`Invalid identifier name at ${nodePos(node)}`);
  return { type: "Identifier", name };
};

const toLiteral = (node: Node): Literal => {
  if (node.type !== "Literal") unsupported(node, `Unsupported literal node: ${node.type}`);
  const value = node.value;
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return { type: "Literal", value };
  }
  unsupported(node, "Unsupported literal value");
  throw new Error("unreachable");
};

const toKey = (node: Node): Identifier | Literal => {
  if (node.type === "Identifier") return toIdentifier(node);
  if (node.type === "Literal") return toLiteral(node);
  unsupported(node, `Unsupported property key: ${node.type}`);
  throw new Error("unreachable");
};

const toPattern = (node: Node): Pattern => {
  switch (node.type) {
    case "Identifier":
      return toIdentifier(node);
    case "RestElement":
      return { type: "RestElement", argument: toPattern(asNode(node.argument, "RestElement.argument")) };
    case "ArrayPattern": {
      const raw = asNodeList(node.elements ?? [], "ArrayPattern.elements");
      const elements: Pattern[] = [];
      for (const el of raw) {
        if (el.type === "Identifier" || el.type === "RestElement" || el.type === "ArrayPattern" || el.type === "ObjectPattern") {
          elements.push(toPattern(el));
          continue;
        }
        unsupported(el, "Unsupported array pattern element");
      }
      return { type: "ArrayPattern", elements };
    }
    case "ObjectPattern": {
      const props = asNodeList(node.properties, "ObjectPattern.properties");
      const properties: (PatternProperty | RestElement)[] = props.map((prop) => {
        if (prop.type === "RestElement") {
          return { type: "RestElement", argument: toPattern(asNode(prop.argument, "RestElement.argument")) };
        }
        if (prop.type !== "Property") unsupported(prop, `Unsupported object pattern property: ${prop.type}`);
        if (prop.kind !== "init" || prop.method === true || prop.computed === true) {
          unsupported(prop, "Unsupported object pattern property form");
        }
        const key = toKey(asNode(prop.key, "Property.key"));
        const value = toPattern(asNode(prop.value, "Property.value"));
        const shorthand = prop.shorthand === true;
        return { type: "Property", key, value, shorthand };
      });
      return { type: "ObjectPattern", properties };
    }
    default:
      unsupported(node, `Unsupported pattern node: ${node.type}`);
      throw new Error("unreachable");
  }
};

const toSpreadElement = (node: Node): SpreadElement => {
  if (node.type !== "SpreadElement") unsupported(node, `Unsupported spread node: ${node.type}`);
  return { type: "SpreadElement", argument: toExpr(asNode(node.argument, "SpreadElement.argument")) };
};

const toExpr = (node: Node): Expr => {
  switch (node.type) {
    case "Identifier":
      return toIdentifier(node);
    case "Literal":
      return toLiteral(node);
    case "ArrayExpression": {
      const raw = asNodeList(node.elements ?? [], "ArrayExpression.elements");
      const elements: (Expr | SpreadElement)[] = raw.map((el) =>
        el.type === "SpreadElement" ? toSpreadElement(el) : toExpr(el)
      );
      return { type: "ArrayExpression", elements };
    }
    case "ObjectExpression": {
      const props = asNodeList(node.properties, "ObjectExpression.properties");
      const properties: (Property | SpreadElement)[] = props.map((prop) => {
        if (prop.type === "SpreadElement") return toSpreadElement(prop);
        if (prop.type !== "Property") unsupported(prop, `Unsupported object expression property: ${prop.type}`);
        if (prop.kind !== "init" || prop.method === true || prop.computed === true) {
          unsupported(prop, "Unsupported object expression property form");
        }
        const key = toKey(asNode(prop.key, "Property.key"));
        const value = toExpr(asNode(prop.value, "Property.value"));
        const shorthand = prop.shorthand === true;
        return { type: "Property", key, value, shorthand };
      });
      return { type: "ObjectExpression", properties };
    }
    case "AwaitExpression":
      return { type: "AwaitExpression", argument: toExpr(asNode(node.argument, "AwaitExpression.argument")) };
    case "CallExpression": {
      const args = asNodeList(node.arguments ?? [], "CallExpression.arguments");
      return {
        type: "CallExpression",
        callee: toExpr(asNode(node.callee, "CallExpression.callee")),
        arguments: args.map((a) => (a.type === "SpreadElement" ? toSpreadElement(a) : toExpr(a))),
      };
    }
    case "MemberExpression": {
      const computed = node.computed === true;
      return {
        type: "MemberExpression",
        object: toExpr(asNode(node.object, "MemberExpression.object")),
        property: toExpr(asNode(node.property, "MemberExpression.property")),
        computed,
      };
    }
    case "AssignmentExpression": {
      const operator = node.operator;
      if (typeof operator !== "string") throw new Error(`Invalid assignment operator at ${nodePos(node)}`);
      return {
        type: "AssignmentExpression",
        operator,
        left: toExpr(asNode(node.left, "AssignmentExpression.left")),
        right: toExpr(asNode(node.right, "AssignmentExpression.right")),
      };
    }
    case "UpdateExpression": {
      const operator = expectStringEnum(node, node.operator, ["++", "--"], "Unsupported update operator");
      return {
        type: "UpdateExpression",
        operator,
        argument: toExpr(asNode(node.argument, "UpdateExpression.argument")),
        prefix: node.prefix === true,
      };
    }
    case "BinaryExpression":
    case "LogicalExpression": {
      const operator = node.operator;
      if (typeof operator !== "string") throw new Error(`Invalid operator at ${nodePos(node)}`);
      return {
        type: node.type,
        operator,
        left: toExpr(asNode(node.left, "Binary/Logical.left")),
        right: toExpr(asNode(node.right, "Binary/Logical.right")),
      };
    }
    case "UnaryExpression": {
      const operator = node.operator;
      if (typeof operator !== "string") throw new Error(`Invalid unary operator at ${nodePos(node)}`);
      return {
        type: "UnaryExpression",
        operator,
        argument: toExpr(asNode(node.argument, "UnaryExpression.argument")),
      };
    }
    case "ConditionalExpression":
      return {
        type: "ConditionalExpression",
        test: toExpr(asNode(node.test, "ConditionalExpression.test")),
        consequent: toExpr(asNode(node.consequent, "ConditionalExpression.consequent")),
        alternate: toExpr(asNode(node.alternate, "ConditionalExpression.alternate")),
      };
    case "ArrowFunctionExpression": {
      const params = asNodeList(node.params ?? [], "ArrowFunctionExpression.params").map(toPattern);
      const bodyNode = asNode(node.body, "ArrowFunctionExpression.body");
      const body = bodyNode.type === "BlockStatement" ? toBlock(bodyNode) : toExpr(bodyNode);
      return {
        type: "ArrowFunctionExpression",
        params,
        body,
        async: node.async === true,
      };
    }
    default:
      unsupported(node, `Unsupported expression: ${node.type}`);
      throw new Error("unreachable");
  }
};

const toVarDecl = (node: Node): VarDecl => {
  if (node.type !== "VariableDeclarator") unsupported(node, `Unsupported declarator node: ${node.type}`);
  return {
    type: "VariableDeclarator",
    id: toPattern(asNode(node.id, "VariableDeclarator.id")),
    init: node.init == null ? null : toExpr(asNode(node.init, "VariableDeclarator.init")),
  };
};

const toLetConstDecls = (node: Node): { kind: "let" | "const"; declarations: VarDecl[] } => {
  if (node.type !== "VariableDeclaration") unsupported(node, `Unsupported declaration node: ${node.type}`);
  const kind = expectStringEnum(node, node.kind, ["let", "const"], "Unsupported variable kind");
  const declarations = asNodeList(node.declarations ?? [], "VariableDeclaration.declarations").map(toVarDecl);
  return { kind, declarations };
};

const toForLeft = (leftNode: Node): { left: VarDecl[] | Expr; leftKind: "let" | "const" | null } => {
  if (leftNode.type === "VariableDeclaration") {
    const { kind, declarations } = toLetConstDecls(leftNode);
    return { left: declarations, leftKind: kind };
  }
  return { left: toExpr(leftNode), leftKind: null };
};

const toBlock = (node: Node): BlockStatement => {
  if (node.type !== "BlockStatement") unsupported(node, `Unsupported block node: ${node.type}`);
  const body = asNodeList(node.body ?? [], "BlockStatement.body")
    .filter((stmt) => stmt.type !== "EmptyStatement")
    .map(toStmt);
  return { type: "BlockStatement", body };
};

const toStmt = (node: Node): Stmt => {
  switch (node.type) {
    case "BlockStatement":
      return toBlock(node);
    case "ExpressionStatement":
      return { type: "ExpressionStatement", expression: toExpr(asNode(node.expression, "ExpressionStatement.expression")) };
    case "IfStatement":
      return {
        type: "IfStatement",
        test: toExpr(asNode(node.test, "IfStatement.test")),
        consequent: toStmt(asNode(node.consequent, "IfStatement.consequent")),
        alternate: node.alternate ? toStmt(asNode(node.alternate, "IfStatement.alternate")) : null,
      };
    case "ReturnStatement":
      return {
        type: "ReturnStatement",
        argument: node.argument == null ? null : toExpr(asNode(node.argument, "ReturnStatement.argument")),
      };
    case "VariableDeclaration": {
      const { kind, declarations } = toLetConstDecls(node);
      return { type: "VariableDeclaration", kind, declarations };
    }
    case "BreakStatement":
      return { type: "BreakStatement" };
    case "ContinueStatement":
      return { type: "ContinueStatement" };
    case "WhileStatement":
      return {
        type: "WhileStatement",
        test: toExpr(asNode(node.test, "WhileStatement.test")),
        body: toStmt(asNode(node.body, "WhileStatement.body")),
      };
    case "ForStatement": {
      const initNode = node.init;
      let init: VarDecl[] | Expr | null = null;
      let initKind: "let" | "const" | null = null;
      if (initNode != null) {
        const iNode = asNode(initNode, "ForStatement.init");
        if (iNode.type === "VariableDeclaration") {
          const parsed = toLetConstDecls(iNode);
          init = parsed.declarations;
          initKind = parsed.kind;
        } else {
          init = toExpr(iNode);
        }
      }
      return {
        type: "ForStatement",
        init,
        initKind,
        test: node.test == null ? null : toExpr(asNode(node.test, "ForStatement.test")),
        update: node.update == null ? null : toExpr(asNode(node.update, "ForStatement.update")),
        body: toStmt(asNode(node.body, "ForStatement.body")),
      };
    }
    case "ForInStatement": {
      const left = toForLeft(asNode(node.left, "ForInStatement.left"));
      return {
        type: "ForInStatement",
        left: left.left,
        leftKind: left.leftKind,
        right: toExpr(asNode(node.right, "ForInStatement.right")),
        body: toStmt(asNode(node.body, "ForInStatement.body")),
      };
    }
    case "ForOfStatement": {
      if (node.await === true) unsupported(node, "for-await-of is not supported");
      const left = toForLeft(asNode(node.left, "ForOfStatement.left"));
      return {
        type: "ForOfStatement",
        left: left.left,
        leftKind: left.leftKind,
        right: toExpr(asNode(node.right, "ForOfStatement.right")),
        body: toStmt(asNode(node.body, "ForOfStatement.body")),
      };
    }
    default:
      unsupported(node, `Unsupported statement: ${node.type}`);
      throw new Error("unreachable");
  }
};

export const parse = (src: string): Program => {
  const raw = acornParse(src, {
    ecmaVersion: "latest",
    sourceType: "script",
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
  }) as unknown as Node;

  if (raw.type !== "Program") unsupported(raw, `Unsupported root node: ${raw.type}`);
  const body = asNodeList(raw.body ?? [], "Program.body")
    .filter((stmt) => stmt.type !== "EmptyStatement")
    .map(toStmt);
  return { type: "Program", body };
};
