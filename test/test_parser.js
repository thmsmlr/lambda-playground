var assert = require("assert")

var parser = require('./../js/lib/parser.js');

describe('Parser', function() {

  describe('#parse()', function() {

    it('should handle applications', function() {
      var tokens = [
        { type: 'identifier', value: 'x' },
        { type: 'identifier', value: 'y' },
      ];

      var ast = ['x','y'];
      var result = parser.parse(tokens);

      assert.deepEqual(result, ast);
      assert(parser.isApp(result));
    });

    it('should handle left associative applications', function() {
      var tokens = [
        { type: 'identifier', value: 'x' },
        { type: 'identifier', value: 'y' },
        { type: 'identifier', value: 'z' },
      ];

      var ast = [['x','y'], 'z'];
      var result = parser.parse(tokens);

      assert.deepEqual(result, ast);
      assert(parser.isApp(result));
    });

    it('should handle right associative applications', function() {
      var tokens = [
        { type: 'identifier', value: 'x' },
        { type: 'lparen',     value: '(' },
        { type: 'identifier', value: 'y' },
        { type: 'identifier', value: 'z' },
        { type: 'rparen',     value: ')' },
      ];

      var ast = ['x',['y','z']];
      var result = parser.parse(tokens);

      assert.deepEqual(result, ast);
      // assert(parser.isApp(result));
    });

    it('should handle multi-variable lambdas', function() {
      var tokens = [
        { type: 'lambda',     value: 'λ' },
        { type: 'identifier', value: 'x' },
        { type: 'identifier', value: 'y' },
        { type: 'identifier', value: 'z' },
        { type: "dot",        value: "." },
        { type: 'identifier', value: 'x' },
      ];

      var ast =
        ['λ', 'x',
          ['λ', 'y',
            ['λ', 'z', 'x']]];

      assert.deepEqual(parser.parse(tokens), ast);
    });

    it('should handle lambda applied to var', function() {
      var tokens = [
        { type: 'identifier', value: 'x' },
        { type: 'lambda',     value: 'λ' },
        { type: 'identifier', value: 'x' },
        { type: 'identifier', value: 'y' },
        { type: 'identifier', value: 'z' },
        { type: "dot",        value: "." },
        { type: 'identifier', value: 'x' },
      ];

      var ast = ['x', ['λ', 'x',
                        ['λ', 'y',
                          ['λ', 'z', 'x']]]];

      assert.deepEqual(parser.parse(tokens), ast);
    });

    it('should handle lambda applied to paren\'d lambda', function() {
      var tokens = [
        { type: 'lparen',     value: '(' },
        { type: 'lambda',     value: 'λ' },
        { type: 'identifier', value: 'x' },
        { type: "dot",        value: "." },
        { type: 'identifier', value: 'x' },
        { type: 'rparen',     value: ')' },
        { type: 'lambda',     value: 'λ' },
        { type: 'identifier', value: 'x' },
        { type: "dot",        value: "." },
        { type: 'identifier', value: 'x' },
      ];

      var ast = [['λ', 'x', 'x'], ['λ', 'x', 'x']];

      assert.deepEqual(parser.parse(tokens), ast);
    });

    it('should handle paren\'d application of 3 terms', function() {
      var tokens = [
        { type: 'identifier', value: 'a' },
        { type: 'lparen',     value: '(' },
        { type: 'lambda',     value: 'λ' },
        { type: 'identifier', value: 'x' },
        { type: "dot",        value: "." },
        { type: 'identifier', value: 'x' },
        { type: 'rparen',     value: ')' },
        { type: 'identifier', value: 'b' },
      ];

      var ast = [['a', ['λ', 'x', 'x']], 'b'];

      assert.deepEqual(parser.parse(tokens), ast);
    });

    it('should handle successor function', function() {
      var tokens = [
        { type: 'lambda',     value: 'λ' },
        { type: 'identifier', value: 'n' },
        { type: 'identifier', value: 's' },
        { type: 'identifier', value: 'z' },
        { type: "dot",        value: "." },
        { type: 'identifier', value: 's' },
        { type: 'lparen',     value: '(' },
        { type: 'identifier', value: 'n' },
        { type: 'identifier', value: 's' },
        { type: 'identifier', value: 'z' },
        { type: 'rparen',     value: ')' },
      ];

      var ast = ['λ', 'n',
                  ['λ', 's',
                    ['λ', 'z', ['s', [['n', 's'], 'z']]]]];

      assert.deepEqual(parser.parse(tokens), ast);
    });

    it('should handle redundant parens', function() {
      var tokens = [
        { type: 'lparen',     value: '(' },
        { type: 'lambda',     value: 'λ' },
        { type: 'identifier', value: 'x' },
        { type: "dot",        value: "." },
        { type: 'identifier', value: 'x' },
        { type: 'rparen',     value: ')' },
        { type: 'lparen',     value: '(' },
        { type: 'lambda',     value: 'λ' },
        { type: 'identifier', value: 'x' },
        { type: "dot",        value: "." },
        { type: 'identifier', value: 'x' },
        { type: 'rparen',     value: ')' },
      ];

      var ast = [['λ', 'x', 'x'], ['λ', 'x', 'x']];

      assert.deepEqual(parser.parse(tokens), ast);
    });

  });

  describe('#isReducible', function() {
    it('should handle vars' , function() {
      var expr = 'x';
      assert(!parser.isReducible(expr));
    });

    it('should handle lambdas' , function() {
      var expr = ['λ', 'x', 'x'];
      assert(!parser.isReducible(expr));
    });

    it('should handle apps without redices' , function() {
      var expr = ['x', 'x'];
      assert(!parser.isReducible(expr));
    });

    it('should handle var applied to lambda' , function() {
      var expr = [['λ', 'x', 'x'], 'y'];
      assert(parser.isReducible(expr));
    });

    it('should recursively find redices', function() {
      var expr = ['λ', 'y', [['λ', 'x', 'x'], 'x']];
      assert(parser.isReducible(expr));
    });

    it('should find reducible rator', function() {
      var expr = [[['λ', 'x', 'x'], 'x'], 'x'];
      assert(parser.isReducible(expr));
    });

    it('should find reducible rand', function() {
      var expr = ['x', [['λ', 'x', 'x'], 'x']];
      assert(parser.isReducible(expr));
    });
  });

  describe('#reduce', function() {
    it('should not reduce a var', function() {
      var expr = 'x';
      var reduced = 'x';
      assert.deepEqual(parser.reduce(expr), reduced);
    });

    it('should not reduce a lambda', function() {
      var expr = ['λ', 'x', 'x'];
      var reduced = ['λ', 'x', 'x'];
      assert.deepEqual(parser.reduce(expr), reduced);
    });

    it('should not reduce a var applied to itself', function() {
      var expr = ['x', 'x'];
      var reduced = ['x', 'x'];
      assert.deepEqual(parser.reduce(expr), reduced);
    });

    it('should not reduce a lambda applied to a var', function() {
      var expr = ['x', ['λ', 'x', 'x']];
      var reduced = ['x', ['λ', 'x', 'x']];
      assert.deepEqual(parser.reduce(expr), reduced);
    });

    it('should reduce a var applied to a lambda', function() {
      var expr = [['λ', 'x', 'x'], 'x'];
      var reduced = 'x';
      assert.deepEqual(parser.reduce(expr), reduced);
    });

    it('should reduce a lambda applied to a lambda', function() {
      var expr = [['λ', 'x', 'x'], ['λ', 'x', 'x']];
      var reduced = ['λ', 'x', 'x'];
      assert.deepEqual(parser.reduce(expr), reduced);
    });

    it('should reduce the next left inner expression', function() {
      var expr = ['x', [['λ', 'y', 'y'], 'z']];
      var reduced = ['x', 'z'];
      assert.deepEqual(parser.reduce(expr), reduced);
    });

  });

  describe('#substitute', function() {
    it('should substitute a variable', function() {
      var variable = 'x';
      var replacement = 'y';
      var expr = 'x';

      assert.deepEqual(parser.substitute(variable, replacement, expr), 'y');
    });

    it('should not substitute a variable', function() {
      var variable = 'x';
      var replacement = 'y';
      var expr = 'z';

      assert.deepEqual(parser.substitute(variable, replacement, expr), 'z');
    });

    it('should substitute an application', function() {
      var variable = 'x';
      var replacement = 'y';
      var expr = ['x', 'x'];

      assert.deepEqual(parser.substitute(variable, replacement, expr), ['y', 'y']);
    });

    it('should not substitute an application', function() {
      var variable = 'x';
      var replacement = 'y';
      var expr = ['z', 'z'];

      assert.deepEqual(parser.substitute(variable, replacement, expr), ['z', 'z']);
    });

    it('should not substitute a bound lambda', function() {
      var variable = 'x';
      var replacement = 'y';
      var expr = ['λ', 'x', 'x'];

      assert.deepEqual(parser.substitute(variable, replacement, expr), ['λ', 'x', 'x']);
    });

    it('should substitute similar, but bound arguement of lambda', function() {
      var variable = 'x';
      var replacement = ['λ', 'y', 'y'];
      var expr = ['λ', 'y', 'x'];

      assert.deepEqual(parser.substitute(variable, replacement, expr), ['λ', 'y', ['λ', 'y', 'y']]);
    });

    it('should substitute similar, but free argument of lambda', function() {
      var variable = 'x';
      var replacement = ['λ', 'x', 'y'];
      var expr = ['λ', 'y', 'x'];

      assert(parser.isAlphaEquivalent(parser.substitute(variable, replacement, expr),
                                      ['λ', 'z', ['λ', 'x', 'y']]));
    });
  });

  describe('#isAlphaEquivalent', function() {
    it('should be false if disperate types', function() {
      var expr_one = 'x';
      var expr_two = ['λ', 'x', 'x'];

      assert(!parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be true if same free variable', function() {
      var expr_one = 'x';
      var expr_two = 'x';

      assert(parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be false if different free variable', function() {
      var expr_one = 'x';
      var expr_two = 'y';

      assert(!parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be true if lambdas have equivalent bound variables', function() {
      var expr_one = ['λ', 'x', 'x'];
      var expr_two = ['λ', 'y', 'y'];

      assert(parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be true if lambdas have equivalent free variables', function() {
      var expr_one = ['λ', 'x', 'z'];
      var expr_two = ['λ', 'y', 'z'];

      assert(parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be false if lambdas have different free variables', function() {
      var expr_one = ['λ', 'x', 'z'];
      var expr_two = ['λ', 'y', 'a'];

      assert(!parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be true if equivalent rator', function() {
      var expr_one = [['λ', 'x', 'x'], 'a'];
      var expr_two = [['λ', 'y', 'y'], 'a'];

      assert(parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be false if different rator', function() {
      var expr_one = [['λ', 'x', 'x'], 'a'];
      var expr_two = [['λ', 'x', 'y'], 'a'];

      assert(!parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be true if equivalent rand', function() {
      var expr_one = ['a', ['λ', 'x', 'x']];
      var expr_two = ['a', ['λ', 'y', 'y']];

      assert(parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be false if different rand', function() {
      var expr_one = ['a', ['λ', 'x', 'x']];
      var expr_two = ['a', ['λ', 'y', 'z']];

      assert(!parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be true when varOf E1 is not free in T', function() {
      var expr_one = ['λ', 'x', ['y', ['λ', 'x', 'x']]];
      var expr_two = ['λ', 'z', ['y', ['λ', 'x', 'x']]];

      assert(parser.isAlphaEquivalent(expr_one, expr_two));
    });

    it('should be false when varOf E1 is free in T', function() {
      var expr_one = ['λ', 'x', ['x', ['λ', 'x', 'x']]];
      var expr_two = ['λ', 'z', ['x', ['λ', 'x', 'x']]];

      assert(!parser.isAlphaEquivalent(expr_one, expr_two));
    });
  });

  describe('#normalize', function() {
    it('should handle successor function applied to a church numeral', function() {
      var expr = [
        ['λ', 'n',
          ['λ', 's',
            ['λ', 'z', ['s', [['n', 's'], 'z']]]]],
        ['λ', 's',
          ['λ', 'z', 'z']]
      ];

      var result = ['λ', 's', ['λ', 'z', ['s', 'z']]];

      assert.deepEqual(parser.normalize(expr), result);
    });
  });

  describe('#asString', function() {
    it('should squash lambdas', function() {
      var expr = ['λ', 'x', ['λ', 'y', ['λ', 'z', 'z']]];
      assert.equal(parser.asString(expr), "λ x y z . z");
    });

    it('should handle left associative applications', function() {
      var expr = [['x', 'y'], 'z'];
      assert.equal(parser.asString(expr), "x y z");
    });

    it('should handle right associative applications', function() {
      var expr = ['x', ['y', 'z']];
      assert.equal(parser.asString(expr), "x (y z)");
    });

    it('should handle squashed lambdas and left associative applications', function() {
      var expr = ['λ', 'x', ['λ', 'y', ['λ', 'z', [['x', 'y'], 'z']]]];
      assert.equal(parser.asString(expr), "λ x y z . x y z");
    });

    it('should handle left associative application with middle lambda', function() {
      var expr = [['a', ['λ', 'x', 'x']], 'b'];
      assert.equal(parser.asString(expr), "a (λ x . x) b");
    });

    it('should handle a lambda being applied to a lambda', function() {
      var expr = [['λ', 'x', 'x'], ['λ', 'x', 'x']];
      assert.equal(parser.asString(expr), "(λ x . x) λ x . x");
    });

    it('should handle successor function', function() {
      var expr = ['λ', 'n', ['λ', 's', ['λ', 'z', ['s', [['n', 's'], 'z']]]]];
      assert.equal(parser.asString(expr), "λ n s z . s (n s z)");
    });
  });
});
