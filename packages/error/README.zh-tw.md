[English](https://github.com/cdziv/devkit/blob/main/packages/error/README.md) | 繁體中文

# 介紹

這是一個簡單的函式庫幫助您創建模組化的錯誤。

## 快速起步

### 安裝

```bash
npm install @cdziv/devkit-error
```

### 錯誤代碼表

使用 `createErrorCodes` 可以方便地建立錯誤代碼表：

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

您也可以使用鍵值對當作 source：

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

### 帶有錯誤碼的錯誤

```ts
import { ErrorWithCode, Values } from '@cdziv/devkit-error';
import { AUTH_ERROR_CODES } from '../error-codes'; // 剛剛建立的錯誤代碼表

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
