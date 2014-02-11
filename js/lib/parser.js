var Lambda = exports.Lambda = function(v, body) {
  return ['λ', v, body];
}

var varOf = exports.varOf = function(lambda) {
  return lambda[1];
}

var bodyOf = exports.bodyOf = function(lambda) {
  return lambda[2];
}

var isLambda = exports.isLambda = function(expr) {
  return (typeof expr === 'object'
            && expr.length === 3
            && expr[0] === 'λ');
}

var App = exports.App = function(x, y) {
  return [x, y];
}

var ratorOf = exports.ratorOf = function(app) {
  return app[0];
}

var randOf = exports.randOf = function(app) {
  return app[1];
}

var isApp = exports.isApp = function(expr) {
  return (typeof expr === 'object'
            && expr.length === 2);
}

var isVar = exports.isVar = function(expr) {
  return (typeof expr === 'string');
}


/*
 * Private: Given a list of tokens where the first token is a
 * left paren, find the index of its matching right paren.
 *
 * Returns Int - index of matching right paren
 */
var _matchingParenIndex = function(tokens) {
  var lparen_count = 1
    , i = 1;

  while(lparen_count > 0) {
    if(tokens[i].type == "lparen") lparen_count++;
    if(tokens[i].type == "rparen") lparen_count--;
    i++;
  }

  return i;
}

/*
 * Public: Given an array of tokens creates an AST
 */
var parse = exports.parse = function(tokens) {
  var i = 0;
  switch(tokens[i].type) {
    case 'lambda':

      // Capture one or more identifiers
      var vars = [];
      while(tokens[i+1] && tokens[i+1].type == 'identifier') {
        vars.push(tokens[++i].value);
      }

      if(vars.length == 0) {
        throw "Parsing error: Lambda requires at least one variable";
      }

      if(tokens[++i].type != 'dot') {
        throw "Parsing error: Lambda requires a dot before body";
      }

      var expr = Lambda(vars[vars.length - 1], parse(tokens.slice(++i, tokens.length)));

      for(var j = vars.length - 2; j >= 0; j--) {
        expr = Lambda(vars[j], expr);
      }

      return expr;

    case 'identifier':
      if(tokens[i+1]) {

        if(tokens[i+1].type == 'lparen') {
          var matching_index = _matchingParenIndex(tokens.slice(i+1, tokens.length));
          var expr = parse(tokens.slice(i + 2, matching_index - i));

          if(tokens[matching_index - i + 1]) {
            var next_expr = parse(tokens.slice(matching_index - i + 1, tokens.length));
            return App(App(tokens[i].value, expr), next_expr);
          } else {
            return App(tokens[i].value, expr);
          }
        } else {
          var expr = parse(tokens.slice(i + 1, tokens.length));
          if(isApp(expr)) {
            return App(App(tokens[i].value, ratorOf(expr)), randOf(expr));
          } else {
            return App(tokens[i].value, expr);
          }
        }
      } else {
        return tokens[i].value;
      }

    case 'lparen':
      // scan to find matching paren
      var matching_index = _matchingParenIndex(tokens.slice(i, tokens.length));

      if(tokens[matching_index - i]) {
        return App( parse(tokens.slice(i + 1 , matching_index - i - 1)),
                    parse(tokens.slice(matching_index - i, tokens.length)));
      } else {
        return parse(tokens.slice(i + 1 , matching_index - i - 1));
      }
  }
}

var isReducible = exports.isReducible = function(expr) {
  if(isLambda(expr)) {
    return isReducible(bodyOf(expr));
  } else if (isApp(expr)) {
    return isLambda(ratorOf(expr))
            || isReducible(ratorOf(expr))
            || isReducible(randOf(expr));
  } else {
    return false;
  }
}

var reduce = exports.reduce = function(expr) {
  if(isLambda(expr)) {
    return Lambda(varOf(expr), reduce(bodyOf(expr)));
  } else if(isApp(expr)) {
    if(isLambda(ratorOf(expr))) {
      return substitute(varOf(ratorOf(expr)), randOf(expr), bodyOf(ratorOf(expr)));
    } else if(isReducible(ratorOf(expr))) {
      return App(reduce(ratorOf(expr)), randOf(expr));
    } else {
      return App(ratorOf(expr), reduce(randOf(expr)));
    }
  } else {
    return expr;
  }
}

var substitute = exports.substitute = function(variable, replacement, expr) {
  if(isVar(expr)) {
    if(variable == expr) {
      return replacement;
    } else {
      return expr;
    }
  } else if(isApp(expr)) {
    return App(substitute(variable, replacement, ratorOf(expr)),
               substitute(variable, replacement, randOf(expr)));
  } else if(isLambda(expr)) {
    if(variable == varOf(expr)) {
      return expr;
    } else if(isFreeVariable(varOf(expr), replacement)) {
      var fresh_variable = "fresh_variable_" + (new Date().valueOf());
      return Lambda(fresh_variable, substitute(variable, replacement,
                                            substitute(varOf(expr), fresh_variable, bodyOf(expr))));
    } else {
      return Lambda(varOf(expr), substitute(variable, replacement, bodyOf(expr)));
    }
  }
};

var isFreeVariable = function(variable, expr) {
  if(isVar(expr)) {
    return (variable === expr);
  } else if(isApp(expr)) {
    return isFreeVariable(variable, ratorOf(expr))
            || isFreeVariable(variable, randOf(expr));
  } else if(isLambda(expr)) {
    if(variable == varOf(expr)) {
      return false;
    } else {
      return isFreeVariable(variable, bodyOf(expr));
    }
  }
};

var isAlphaEquivalent = exports.isAlphaEquivalent = function(expr_one, expr_two) {
  if(isApp(expr_one) && isApp(expr_two)) {
    return isAlphaEquivalent(ratorOf(expr_one), ratorOf(expr_two))
            && isAlphaEquivalent(randOf(expr_one), randOf(expr_two))
  } else if(isLambda(expr_one) && isLambda(expr_two)) {
    return !isFreeVariable(varOf(expr_one), bodyOf(expr_two))
            && isAlphaEquivalent(bodyOf(expr_one),
                                  substitute(varOf(expr_two), varOf(expr_one), bodyOf(expr_two)));
  } else if(isVar(expr_one) && isVar(expr_two)) {
    return (expr_one == expr_two);
  } else {
    return false;
  }
};

var normalize = exports.normalize = function(expr) {
  if(isReducible(expr)) {
    return normalize(reduce(expr));
  } else {
    return expr;
  }
};

/*
 * Public: Converts a lambda calculus expression into a less redundant, more 
 *         human-readable string.
 */
var asString = exports.asString = function(expr) {
  if(isVar(expr)) {
    return expr;
  } else if(isLambda(expr)) {
    var inner_expr = expr
      , str = "λ";

    do {
      str += " " + varOf(inner_expr);
      inner_expr = bodyOf(inner_expr);
    } while(isLambda(inner_expr))

    str = str + " . " + asString(inner_expr);

    return str;
  } else if(isApp(expr)) {
    // Wrap the inner expression with parenthesis if deemed worthy by the gods
    if(isLambda(ratorOf(expr))) {
      return "(" + asString(ratorOf(expr)) + ") " + asString(randOf(expr));
    } else if(isLambda(randOf(expr)) || isApp(randOf(expr))) {
      return asString(ratorOf(expr)) + " (" + asString(randOf(expr)) + ")";
    } else {
      return asString(ratorOf(expr)) + " " + asString(randOf(expr));
    }
  }
};
