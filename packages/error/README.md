English | [繁體中文](https://github.com/cdziv/devkit/blob/main/packages/error/README.zh-tw.md)

# Introduction

This is a simple library to help you create modular errors.

## Quick Start

### Installation

```bash
npm install @cdziv/devkit-error
```

### Error Code Table

Use `createErrorCodes` to easily create an error code table:

```ts
import { createErrorCodes } from '@cdziv/devkit-error';

const source = [
  'RESOURCE_NOT_FOUND',
  'ARGUMENT_INVALID',
  'STATE_CONFLICT',
] as const;
const moduleName = 'AUTH' as const;
const delimiter = '.' as const;
const AUTH_ERROR_CODES = createErrorCodes(source, { moduleName, delimiter });

expect(AUTH_ERROR_CODES).toEqual({
  RESOURCE_NOT_FOUND: 'USER.RESOURCE_NOT_FOUND',
  ARGUMENT_INVALID: 'USER.ARGUMENT_INVALID',
  STATE_CONFLICT: 'USER.STATE_CONFLICT',
});
```

You can also use key-value pairs as the source:

```ts
const source = {
  ResourceNotFound: 'resource-not-found',
  ArgumentInvalid: 'argument-invalid',
  StateConflict: 'state-conflict',
} as const;
const moduleName = 'auth' as const;
const delimiter = '/' as const;
const AUTH_ERROR_CODES = createErrorCodes(source, { moduleName, delimiter });

expect(AUTH_ERROR_CODES).toEqual({
  ResourceNotFound: 'auth/resource-not-found',
  ArgumentInvalid: 'auth/argument-invalid',
  StateConflict: 'auth/state-conflict',
});
```

### Errors with Error Codes

```ts
import { ErrorWithCode, Values } from '@cdziv/devkit-error';
import { AUTH_ERROR_CODES } from '../error-codes'; // The error code table created earlier

abstract class AuthError extends ErrorWithCode {
  abstract readonly code: Values<typeof AUTH_ERROR_CODES>;
}
class ResourceNotFoundError extends AuthError {
  readonly code = AUTH_ERROR_CODES.ResourceNotFound;
  readonly name = 'ResourceNotFoundError';

  constructor(message = 'Something missing') {
    super(message);
  }
}

const resourceNotFoundError = new ResourceNotFoundError();

expect(resourceNotFoundError.code).toBe('auth/resource-not-found');
expect(resourceNotFoundError.toString()).toBe(
  'ResourceNotFoundError (auth/resource-not-found): Something missing'
);
```
