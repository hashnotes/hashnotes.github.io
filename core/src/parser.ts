import { parse as acornParse } from "acorn";


/** Loose AST node type — acorn nodes with `type`, `start`, `end` + arbitrary fields. */
export type AstNode = { type: string; start: number; end: number; [k: string]: any };

// ---------------------------------------------------------------------------
// Scope validation
// ---------------------------------------------------------------------------

export const validateScopes = (program: AstNode, allowedGlobals: string[] = []) => {
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

  const declarePattern = (p: AstNode) => {
    if (p.type === "Identifier") declare(p.name);
    else if (p.type === "RestElement") declarePattern(p.argument);
    else if (p.type === "ArrayPattern") (p.elements as AstNode[]).forEach(declarePattern);
    else if (p.type === "ObjectPattern") (p.properties as AstNode[]).forEach((prop) => {
      if (prop.type === "RestElement") declarePattern(prop.argument);
      else declarePattern(prop.value);
    });
  };

  const visitExpr = (e: AstNode): void => {
    if (!e) return;
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
        (e.elements as AstNode[]).forEach((el) => el && visitExpr(el));
        return;
      case "ObjectExpression":
        (e.properties as AstNode[]).forEach((p) => {
          if (p.type === "SpreadElement") visitExpr(p.argument);
          else visitExpr(p.value);
        });
        return;
      case "AwaitExpression":
        visitExpr(e.argument);
        return;
      case "CallExpression":
        visitExpr(e.callee);
        (e.arguments as AstNode[]).forEach((a) => visitExpr(a));
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
        (e.params as AstNode[]).forEach(declarePattern);
        if (e.body.type === "BlockStatement") visitStmt(e.body);
        else visitExpr(e.body);
        exit();
        return;
    }
  };

  const visitVarDecl = (d: AstNode) => {
    declarePattern(d.id);
    if (d.init) visitExpr(d.init);
  };

  const visitStmt = (s: AstNode): void => {
    switch (s.type) {
      case "BlockStatement":
        enter();
        (s.body as AstNode[]).forEach(visitStmt);
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
        (s.declarations as AstNode[]).forEach(visitVarDecl);
        return;
      case "WhileStatement":
        visitExpr(s.test);
        visitStmt(s.body);
        return;
      case "ForStatement": {
        enter();
        if (s.init?.type === "VariableDeclaration") (s.init.declarations as AstNode[]).forEach(visitVarDecl);
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
        if (s.left.type === "VariableDeclaration") (s.left.declarations as AstNode[]).forEach(visitVarDecl);
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

  (program.body as AstNode[]).forEach(visitStmt);
  return errors;
};

// ---------------------------------------------------------------------------
// Prototype access validation
// ---------------------------------------------------------------------------

export const validateNoPrototype = (program: AstNode) => {
  const errors: string[] = [];
  const forbiddenMembers = new Set(["prototype", "constructor", "__proto__"]);

  const visitExpr = (e: AstNode): void => {
    if (!e) return;
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
        (e.arguments as AstNode[]).forEach((a) => visitExpr(a));
        return;
      case "AwaitExpression":
        visitExpr(e.argument);
        return;
      case "ArrayExpression":
        (e.elements as AstNode[]).forEach((el) => el && visitExpr(el));
        return;
      case "ObjectExpression":
        (e.properties as AstNode[]).forEach((p) => {
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

  const visitStmt = (s: AstNode): void => {
    switch (s.type) {
      case "BlockStatement":
        (s.body as AstNode[]).forEach(visitStmt);
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
        (s.declarations as AstNode[]).forEach((d) => d.init && visitExpr(d.init));
        return;
      case "WhileStatement":
        visitExpr(s.test);
        visitStmt(s.body);
        return;
      case "ForStatement":
        if (s.init?.type === "VariableDeclaration") (s.init.declarations as AstNode[]).forEach((d: AstNode) => d.init && visitExpr(d.init));
        else if (s.init) visitExpr(s.init);
        if (s.test) visitExpr(s.test);
        if (s.update) visitExpr(s.update);
        visitStmt(s.body);
        return;
      case "ForInStatement":
      case "ForOfStatement":
        if (s.left.type === "VariableDeclaration") (s.left.declarations as AstNode[]).forEach((d: AstNode) => d.init && visitExpr(d.init));
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        return;
      case "BreakStatement":
      case "ContinueStatement":
        return;
    }
  };

  (program.body as AstNode[]).forEach(visitStmt);
  return errors;
};

// ---------------------------------------------------------------------------
// Parser — returns acorn AST directly
// ---------------------------------------------------------------------------

export const parse = (src: string): AstNode => {
  return acornParse(src, {
    ecmaVersion: "latest",
    sourceType: "script",
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
  }) as unknown as AstNode;
};
