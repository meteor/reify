// FunctionDeclaration
async function functionDeclaration() {
  const result = await Promise.resolve("This is a function declaration");
  return result;
}

// FunctionExpression
var functionExpression = async function() {
  const result = await Promise.resolve("This is a function expression");
  return result;
};

// ArrowFunctionExpression
var arrowFunctionExpression = async () => {
  const result = await Promise.resolve("This is an arrow function expression");
  return result;
};

// ClassMethod
class MyClass {
  async classMethod() {
    const result = await Promise.resolve("This is a class method");
    return result;
  }
}

// ObjectMethod
var myObject = {
  objectMethod: async function() {
    const result = await Promise.resolve("This is an object method");
    return result;
  }
};

// ClassPrivateMethod
class MyClassWithPrivateMethod {
  async #privateMethod() {
    const result = await Promise.resolve("This is a private class method");
    return result;
  }

  async callPrivateMethod() {
    return this.#privateMethod();
  }
}

module.exports = {
  functionDeclaration,
  functionExpression,
  arrowFunctionExpression,
  MyClass,
  myObject,
  MyClassWithPrivateMethod
};