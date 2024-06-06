const FUNCTION_TYPES = [
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'ClassMethod',
  'ObjectMethod',
  'ClassPrivateMethod',
]

function isTopLevelAwait(ancestors) {
  for (let ancestor of ancestors) {
    if (FUNCTION_TYPES.includes(ancestor.type)) {
      return false;
    }
  }
  return true;
}

module.exports = { isTopLevelAwait }