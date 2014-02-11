var assert = require("assert")

var lexer = require('./../js/lib/lexer.js');

describe('Lexer', function() {

  describe('#tokenize()', function() {
    it('should handle multi-character identifiers', function() {
      var program = "apple";
      var tokens = [
        { type: "identifier", value: "apple" },
      ];

      assert.deepEqual(lexer.tokenize(program), tokens);
    });

    it('should handle basic lambda expression', function() {
      var program = "λx.x";
      var tokens = [
        { type: "lambda",     value: "λ" },
        { type: "identifier", value: "x" },
        { type: "dot",        value: "." },
        { type: "identifier", value: "x" },
      ];

      assert.deepEqual(lexer.tokenize(program), tokens);
    });

    it('should handle multi-variable lambda expression', function() {
      var program = "λx y.x";
      var tokens = [
        { type: "lambda",     value: "λ" },
        { type: "identifier", value: "x" },
        { type: "identifier", value: "y" },
        { type: "dot",        value: "." },
        { type: "identifier", value: "x" },
      ];

      assert.deepEqual(lexer.tokenize(program), tokens);
    });

    it('should handle basic application', function() {
      var program = "x y";
      var tokens = [
        { type: "identifier", value: "x" },
        { type: "identifier", value: "y" },
      ];

      assert.deepEqual(lexer.tokenize(program), tokens);
    });

    it('should handle application with parens', function() {
      var program = "(x y)";
      var tokens = [
        { type: "lparen",     value: "(" },
        { type: "identifier", value: "x" },
        { type: "identifier", value: "y" },
        { type: "rparen",     value: ")" },
      ];

      assert.deepEqual(lexer.tokenize(program), tokens);
    });

  });
});
