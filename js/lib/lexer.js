exports.tokenize = function(str) {
  var tokens = [];

  for(var i = 0; i < str.length; i++) {
    if(str[i] === "λ") {
      tokens.push({ type: "lambda", value: str[i] });
    } else if (str[i] === ".") {
      tokens.push({ type: "dot" , value: str[i] });
    } else if (str[i] === "(") {
      tokens.push({ type: "lparen" , value: str[i] });
    } else if (str[i] === ")") {
      tokens.push({ type: "rparen" , value: str[i] });
    } else if (/^[a-zA-Z]$/.test(str[i])) {
      var identifier = str[i];

      while(/^[a-zA-Z]$/.test(str[i+1])) {
        identifier += str[++i];
      }

      tokens.push({ type: "identifier" , value: identifier});
    } else if (str[i] === " ") {
      continue;
    } else {
      throw "Lexing Error: Unknown character, " + str[i];
    }
  }

  return tokens;
}
